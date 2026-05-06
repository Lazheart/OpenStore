import os

USER_SERVICE_URL = "http://localhost:8080"
USER_AUTH_BASE_PATH = "/auth"
SHOP_SERVICE_URL = "http://localhost:3000"
PRODUCT_SERVICE_URL = "http://localhost:8000"


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
	return f"{SHOP_SERVICE_URL}/shop/{shop_id}"


def shop_delete_url(shop_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/shop/id/{shop_id}"


def shop_get_by_id_url(shop_id: str) -> str:
	return f"{SHOP_SERVICE_URL}/shop/{shop_id}"


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


def shop_list_url(page: int = 1, limit: int = 10) -> str:
	return f"{SHOP_SERVICE_URL}/shops?page={page}&limit={limit}"


def product_list_by_shop_url(shop_id: str) -> str:
	return f"{PRODUCT_SERVICE_URL}/shops/{shop_id}/products"


def product_create_url(shop_id: str) -> str:
	return f"{PRODUCT_SERVICE_URL}/shops/{shop_id}/products"


def product_update_url(shop_id: str, product_id: str) -> str:
	return f"{PRODUCT_SERVICE_URL}/shops/{shop_id}/products/{product_id}"
