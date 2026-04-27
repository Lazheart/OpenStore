from __future__ import annotations

from models import Availability, ProductCreateRequest, ProductListItem

from integrations import BadRequestError, NotFoundError, external_service_client, product_repository


class ProductService:
    async def _ensure_shop_exists(self, shop_id: str) -> None:
        await external_service_client.get_shop(shop_id)

    async def _ensure_owner(self, shop_id: str, authorization: str | None) -> str:
        user = await external_service_client.get_current_user(authorization)
        if str(user.role).upper() != "OWNER":
            raise BadRequestError("Solo un usuario OWNER puede administrar productos")

        shop = await external_service_client.get_shop(shop_id)
        if str(shop.owner_id) != str(user.user_id):
            raise BadRequestError("No puedes modificar productos de una tienda que no te pertenece")

        return user.user_id

    async def list_products(self, shop_id: str) -> list[ProductListItem]:
        await self._ensure_shop_exists(shop_id)
        return await product_repository.list_products(shop_id)

    async def create_product_with_url(
        self,
        shop_id: str,
        payload: ProductCreateRequest,
        *,
        authorization: str | None,
    ) -> str:
        owner_id = await self._ensure_owner(shop_id, authorization)
        if not str(payload.imageUrl).strip():
            raise BadRequestError("Product image is required")
        return await product_repository.create_product(
            shop_id,
            payload,
            image_url=str(payload.imageUrl),
            owner_id=owner_id,
        )

    async def create_product_with_uploaded_url(
        self,
        shop_id: str,
        *,
        authorization: str | None,
        name: str,
        price: float,
        description: str,
        image_url: str,
    ) -> str:
        owner_id = await self._ensure_owner(shop_id, authorization)
        if price < 0:
            raise BadRequestError("Price must be greater than or equal to 0")
        payload = ProductCreateRequest(name=name, price=price, description=description, imageUrl=image_url)
        return await product_repository.create_product(
            shop_id,
            payload,
            image_url=image_url,
            owner_id=owner_id,
        )

    async def update_product(
        self,
        shop_id: str,
        product_id: str,
        *,
        authorization: str | None,
        name: str | None = None,
        price: float | None = None,
        availability: Availability | None = None,
        image_url: str | None = None,
    ) -> None:
        await self._ensure_owner(shop_id, authorization)
        if name is None and price is None and availability is None and image_url is None:
            raise BadRequestError("At least one field must be provided")
        if price is not None and price < 0:
            raise BadRequestError("Price must be greater than or equal to 0")
        await product_repository.update_product(
            shop_id,
            product_id,
            name=name,
            price=price,
            availability=availability,
            image_url=image_url,
        )


product_service = ProductService()
