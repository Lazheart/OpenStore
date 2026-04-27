from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from events import OwnerDeletedEvent, ProductDeletionRequestedEvent, ShopDeletionRequestedEvent, event_bus
from mapping import (
	AuthLoginRequest,
	AuthRegisterRequest,
	ShopCreateRequest,
	ShopUpdateRequest,
	UserDeletedEventRequest,
	build_shop_create_payload,
	build_shop_update_payload,
)
from services_paths import (
	DEFAULT_TIMEOUT_SECONDS,
	EVENTS_INTERNAL_TOKEN,
	shop_create_url,
	shop_get_by_id_url,
	shop_get_by_name_url,
	shop_update_url,
	user_me_url,
	user_auth_login_url,
	user_auth_register_url,
)

app = FastAPI(title="store-service")

# Templates folder (relative to store-service/)
templates = Jinja2Templates(directory="templates")


@app.on_event("startup")
async def _startup_events() -> None:
	await event_bus.start()


@app.on_event("shutdown")
async def _shutdown_events() -> None:
	await event_bus.shutdown()


def _build_auth_headers(authorization: str | None = None) -> dict[str, str]:
	headers: dict[str, str] = {"Content-Type": "application/json"}
	if authorization:
		headers["Authorization"] = authorization
	return headers


async def _forward(
	method: str,
	url: str,
	payload: dict[str, Any] | None = None,
	authorization: str | None = None,
) -> Any:
	try:
		async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS) as client:
			response = await client.request(
				method=method,
				url=url,
				headers=_build_auth_headers(authorization),
				json=payload,
			)
	except httpx.RequestError as exc:
		raise HTTPException(status_code=502, detail=f"Error de conexion con servicio externo: {exc}") from exc

	if response.status_code >= 400:
		try:
			detail = response.json()
		except ValueError:
			detail = {"error": response.text}
		raise HTTPException(status_code=response.status_code, detail=detail)

	if not response.text:
		return None

	try:
		return response.json()
	except ValueError:
		return {"message": response.text}


async def _resolve_current_user(authorization: str | None) -> dict[str, Any]:
	if not authorization:
		raise HTTPException(status_code=401, detail="Acceso denegado. Token no proporcionado.")

	user = await _forward("GET", user_me_url(), authorization=authorization)
	if not isinstance(user, dict) or user.get("id") is None:
		raise HTTPException(status_code=400, detail="No se pudo obtener el usuario autenticado")

	return user


def _validate_internal_token(internal_token: str | None) -> None:
	if not EVENTS_INTERNAL_TOKEN:
		raise HTTPException(status_code=500, detail="EVENTS_INTERNAL_TOKEN no configurado")

	if internal_token != EVENTS_INTERNAL_TOKEN:
		raise HTTPException(status_code=403, detail="Token interno invalido")


@app.get("/")
def root() -> dict[str, str]:
	return {"service": "store-service", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


@app.get("/me")
async def me(authorization: str | None = Header(default=None)) -> Any:
	if not authorization:
		raise HTTPException(status_code=401, detail="Acceso denegado. Token no proporcionado.")

	return await _forward("GET", user_me_url(), authorization=authorization)


@app.post("/auth/login")
async def auth_login(payload: AuthLoginRequest) -> Any:
	target_url = user_auth_login_url(payload.shopId)
	body = {
		"identifier": payload.identifier,
		"password": payload.password,
	}
	return await _forward("POST", target_url, payload=body)


@app.post("/auth/register")
async def auth_register(payload: AuthRegisterRequest) -> Any:
	target_url = user_auth_register_url(payload.shopId)
	body = {
		"email": payload.email,
		"phoneNumber": payload.phoneNumber,
		"name": payload.name,
	}
	return await _forward("POST", target_url, payload=body)


@app.post("/openshop/shop", status_code=201)
async def create_shop(payload: ShopCreateRequest, authorization: str | None = Header(default=None)) -> Any:
	# Shop-service aplica las reglas de rol, plan y unicidad del nombre.
	return await _forward(
		"POST",
		shop_create_url(),
		payload=build_shop_create_payload(payload),
		authorization=authorization,
	)


@app.get("/shop/name/{shop_name}")
async def get_shop_by_name(shop_name: str) -> Any:
	return await _forward("GET", shop_get_by_name_url(shop_name))


@app.patch("/shop/id/{shop_id}")
async def update_shop(
	shop_id: int,
	payload: ShopUpdateRequest,
	authorization: str | None = Header(default=None),
) -> Any:
	return await _forward(
		"PATCH",
		shop_update_url(shop_id),
		payload=build_shop_update_payload(payload),
		authorization=authorization,
	)


@app.delete("/shop/id/{shop_id}")
async def delete_shop(shop_id: int, authorization: str | None = Header(default=None)) -> Any:
	user = await _resolve_current_user(authorization)
	shop = await _forward("GET", shop_get_by_id_url(shop_id))

	if not isinstance(shop, dict) or shop.get("ownerId") is None:
		raise HTTPException(status_code=404, detail="Tienda no encontrada")

	shop_owner_id_raw = shop.get("ownerId")
	user_id_raw = user.get("id")
	try:
		shop_owner_id = int(str(shop_owner_id_raw))
		user_id = int(str(user_id_raw))
	except ValueError as exc:
		raise HTTPException(status_code=400, detail="No se pudo validar ownership de la tienda") from exc

	if shop_owner_id != user_id:
		raise HTTPException(status_code=403, detail="No puedes eliminar una tienda que no te pertenece")

	await event_bus.publish(ShopDeletionRequestedEvent(shop_id=shop_id))
	return {"status": "accepted", "event": "SHOP_DELETION_REQUESTED", "shopId": shop_id}


@app.delete("/shops/{shop_id}/products/{product_id}")
async def delete_product(shop_id: int, product_id: str, authorization: str | None = Header(default=None)) -> dict[str, str | int]:
	if not authorization:
		raise HTTPException(status_code=401, detail="Acceso denegado. Token no proporcionado.")

	await event_bus.publish(
		ProductDeletionRequestedEvent(
			shop_id=shop_id,
			product_id=product_id,
			authorization=authorization,
		)
	)
	return {
		"status": "accepted",
		"event": "PRODUCT_DELETION_REQUESTED",
		"shopId": shop_id,
		"productId": product_id,
	}


@app.post("/events/users/{user_id}/deleted")
async def on_user_deleted_event(
	user_id: int,
	payload: UserDeletedEventRequest,
	x_internal_token: str | None = Header(default=None),
) -> dict[str, str | int]:
	_validate_internal_token(x_internal_token)

	if payload.role is not None and payload.role.upper() != "OWNER":
		return {"status": "ignored", "event": "USER_DELETED", "userId": user_id}

	await event_bus.publish(OwnerDeletedEvent(owner_id=user_id))
	return {"status": "accepted", "event": "OWNER_DELETED", "userId": user_id}


@app.get("/shop/id/{shop_id}/owner")
async def get_owner_by_shop_id(shop_id: int) -> dict[str, int]:
	shop_data = await _forward("GET", shop_get_by_id_url(shop_id))

	owner_id = shop_data.get("ownerId") if isinstance(shop_data, dict) else None
	if owner_id is None:
		raise HTTPException(status_code=404, detail="No se pudo resolver ownerId para la tienda")

	return {"shopId": shop_id, "ownerId": int(owner_id)}


@app.get("/docs", response_class=HTMLResponse)
async def docs(request: Request) -> HTMLResponse:
	from services_paths import SHOP_SERVICE_URL, PRODUCT_SERVICE_URL, USER_SERVICE_URL

	services = [
		{"name": "Shop Service", "url": f"{SHOP_SERVICE_URL}/api-docs"},
		{"name": "Product Service", "url": f"{PRODUCT_SERVICE_URL}/docs"},
		{"name": "User Service (Swagger UI)", "url": f"{USER_SERVICE_URL}/swagger-ui/index.html"},
	]

	return templates.TemplateResponse("docs.html", {"request": request, "services": services})
