import os
from uuid import UUID, uuid4

from models import Availability, Product, ProductCreateRequest, ProductListItem


class NotFoundError(Exception):
    pass


class BadRequestError(Exception):
    pass


class ProductService:
    def __init__(self) -> None:
        self._products: dict[UUID, Product] = {}
        self._shop_products: dict[UUID, set[UUID]] = {}

    def _shop_exists(self, shop_id: UUID) -> bool:
        mode = os.getenv("SHOP_VALIDATION_MODE", "allow_all").strip().lower()
        if mode == "strict":
            raw = os.getenv("MOCK_SHOP_IDS", "")
            allowed: set[UUID] = set()
            for token in raw.split(","):
                token = token.strip()
                if not token:
                    continue
                allowed.add(UUID(token))
            return shop_id in allowed
        return True

    def _ensure_shop_exists(self, shop_id: UUID) -> None:
        if not self._shop_exists(shop_id):
            raise NotFoundError("Shop not found")

    def _ensure_product_in_shop(self, shop_id: UUID, product_id: UUID) -> Product:
        self._ensure_shop_exists(shop_id)
        product = self._products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        if product.shopId != shop_id:
            raise NotFoundError("Product not found for this shop")
        return product

    def list_products(self, shop_id: UUID) -> list[ProductListItem]:
        self._ensure_shop_exists(shop_id)
        product_ids = self._shop_products.get(shop_id, set())
        items: list[ProductListItem] = []
        for product_id in product_ids:
            product = self._products[product_id]
            items.append(
                ProductListItem(
                    productId=product.id,
                    imageUrl=product.imageUrl,
                    name=product.name,
                    price=product.price,
                    availability=product.availability,
                )
            )
        return items

    def create_product_with_url(self, shop_id: UUID, payload: ProductCreateRequest) -> UUID:
        self._ensure_shop_exists(shop_id)
        product_id = uuid4()
        product = Product(
            id=product_id,
            name=payload.name,
            price=payload.price,
            description=payload.description,
            imageUrl=payload.imageUrl,
            availability=Availability.AVAILABLE,
            shopId=shop_id,
        )
        self._products[product_id] = product
        self._shop_products.setdefault(shop_id, set()).add(product_id)
        return product_id

    def create_product_with_uploaded_url(
        self,
        shop_id: UUID,
        *,
        name: str,
        price: float,
        description: str,
        image_url: str,
    ) -> UUID:
        if price < 0:
            raise BadRequestError("Price must be greater than or equal to 0")
        payload = ProductCreateRequest(
            name=name,
            price=price,
            description=description,
            imageUrl=image_url,
        )
        return self.create_product_with_url(shop_id, payload)

    def update_product(
        self,
        shop_id: UUID,
        product_id: UUID,
        *,
        price: float | None = None,
        availability: Availability | None = None,
        image_url: str | None = None,
    ) -> None:
        product = self._ensure_product_in_shop(shop_id, product_id)
        if price is None and availability is None and image_url is None:
            raise BadRequestError("At least one field must be provided")
        if price is not None:
            if price < 0:
                raise BadRequestError("Price must be greater than or equal to 0")
            product.price = price
        if availability is not None:
            product.availability = availability
        if image_url is not None:
            product.imageUrl = image_url


product_service = ProductService()
