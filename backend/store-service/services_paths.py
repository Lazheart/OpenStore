import os


USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8080")
USER_AUTH_BASE_PATH = os.getenv("USER_AUTH_BASE_PATH", "/api/auth")
SHOP_SERVICE_URL = os.getenv("SHOP_SERVICE_URL", "http://shop-service:3000")
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8000")
EVENTS_INTERNAL_TOKEN = os.getenv("EVENTS_INTERNAL_TOKEN", "").strip()
DEFAULT_TIMEOUT_SECONDS = float(os.getenv("STORE_SERVICE_TIMEOUT", "15"))


def user_auth_login_url(shop_id: str | None = None) -> str:
	if shop_id is None:
		return f"{USER_SERVICE_URL}{USER_AUTH_BASE_PATH}/login"
	return f"{USER_SERVICE_URL}{USER_AUTH_BASE_PATH}/{shop_id}/login"


def user_auth_register_url(shop_id: str | None = None) -> str:
	if shop_id is None:
		return f"{USER_SERVICE_URL}{USER_AUTH_BASE_PATH}/register"
	return f"{USER_SERVICE_URL}{USER_AUTH_BASE_PATH}/{shop_id}/register"


def shop_create_url() -> str:
	return f"{SHOP_SERVICE_URL}/openshop/shop"


def shop_get_by_name_url(shop_name: str) -> str:
	return f"{SHOP_SERVICE_URL}/shop/name/{shop_name}"


def shop_update_url(shop_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/shop/id/{shop_id}"


def shop_delete_url(shop_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/shop/id/{shop_id}"


def shop_get_by_id_url(shop_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/shops/{shop_id}"


def user_me_url() -> str:
	return f"{USER_SERVICE_URL}/me"


def product_delete_url(shop_id: str, product_id: str) -> str:
	return f"{PRODUCT_SERVICE_URL}/shops/{shop_id}/products/{product_id}"


def product_purge_by_shop_url(shop_id: str) -> str:
	return f"{PRODUCT_SERVICE_URL}/internal/shops/{shop_id}/products"


def shop_internal_delete_url(shop_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/internal/shops/{shop_id}"


def shop_list_by_owner_url(owner_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/owners/{owner_id}/shops"
