from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx

from services_paths import (
	DEFAULT_TIMEOUT_SECONDS,
	EVENTS_INTERNAL_TOKEN,
	product_purge_by_shop_url,
	shop_internal_delete_url,
	shop_list_by_owner_url,
)


@dataclass(frozen=True)
class ShopDeletionRequestedEvent:
	shop_id: str


@dataclass(frozen=True)
class OwnerDeletedEvent:
	owner_id: str


EventPayload = ShopDeletionRequestedEvent | OwnerDeletedEvent | None


class EventBus:
	def __init__(self) -> None:
		self.queue: asyncio.Queue[EventPayload] = asyncio.Queue()
		self.worker_task: asyncio.Task[None] | None = None

	async def start(self) -> None:
		if self.worker_task and not self.worker_task.done():
			return
		self.worker_task = asyncio.create_task(self._worker(), name="store-service-event-worker")

	async def shutdown(self) -> None:
		await self.queue.put(None)
		if self.worker_task:
			await self.worker_task

	async def publish(self, event: EventPayload) -> None:
		await self.queue.put(event)

	async def _worker(self) -> None:
		while True:
			event = await self.queue.get()
			try:
				if event is None:
					return
				await self._dispatch(event)
			except Exception as exc:
				print(f"[events] Error procesando evento {event}: {exc}")
			finally:
				self.queue.task_done()

	async def _dispatch(self, event: EventPayload) -> None:
		if isinstance(event, ShopDeletionRequestedEvent):
			await self._handle_shop_deletion(event)
			return

		if isinstance(event, OwnerDeletedEvent):
			await self._handle_owner_deleted(event)
			return

	async def _handle_shop_deletion(self, event: ShopDeletionRequestedEvent) -> None:
		if not EVENTS_INTERNAL_TOKEN:
			raise RuntimeError("EVENTS_INTERNAL_TOKEN no esta configurado")

		headers = {"x-internal-token": EVENTS_INTERNAL_TOKEN, "Content-Type": "application/json"}
		async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS) as client:
			purge_response = await client.delete(product_purge_by_shop_url(event.shop_id), headers=headers)
			if purge_response.status_code not in {200, 404}:
				raise RuntimeError(
					f"No se pudieron purgar productos de la tienda {event.shop_id}: {purge_response.status_code}"
				)

			delete_response = await client.delete(shop_internal_delete_url(event.shop_id), headers=headers)
			if delete_response.status_code not in {200, 404}:
				raise RuntimeError(
					f"No se pudo eliminar la tienda {event.shop_id}: {delete_response.status_code}"
				)

	async def _handle_owner_deleted(self, event: OwnerDeletedEvent) -> None:
		if not EVENTS_INTERNAL_TOKEN:
			raise RuntimeError("EVENTS_INTERNAL_TOKEN no esta configurado")

		headers = {"x-internal-token": EVENTS_INTERNAL_TOKEN, "Content-Type": "application/json"}
		async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS) as client:
			response = await client.get(shop_list_by_owner_url(event.owner_id), headers=headers)
			if response.status_code == 404:
				return
			if response.status_code != 200:
				raise RuntimeError(
					f"No se pudieron listar tiendas del owner {event.owner_id}: {response.status_code}"
				)

			payload = response.json()
			shops = payload.get("shops", []) if isinstance(payload, dict) else []

			for shop in shops:
				shop_id_raw = shop.get("shopId") if isinstance(shop, dict) else None
				if shop_id_raw is None:
					continue
				await self._handle_shop_deletion(ShopDeletionRequestedEvent(shop_id=str(shop_id_raw)))

event_bus = EventBus()
