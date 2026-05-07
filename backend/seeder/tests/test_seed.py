import os
import pytest

# Set env vars before importing seed so sys.exit is not triggered
os.environ["STORE_SERVICE_URL"] = "http://test-store:8004"
os.environ["NUM_SHOPS"] = "2"
os.environ["PRODUCTS_PER_SHOP"] = "3"
os.environ["USERS_PER_SHOP"] = "4"
os.environ["CONCURRENCY"] = "5"

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from seed import (
    STORE_SERVICE_URL,
    NUM_SHOPS,
    PRODUCTS_PER_SHOP,
    USERS_PER_SHOP,
    CONCURRENCY,
    gen_owner,
    gen_shop,
    gen_product,
    gen_shop_user,
)


# --- Config ---
def test_config_reads_store_service_url():
    assert STORE_SERVICE_URL == "http://test-store:8004"


def test_config_reads_num_shops():
    assert NUM_SHOPS == 2


def test_config_reads_products_per_shop():
    assert PRODUCTS_PER_SHOP == 3


def test_config_reads_users_per_shop():
    assert USERS_PER_SHOP == 4


def test_config_reads_concurrency():
    assert CONCURRENCY == 5


# --- Generators ---
def test_gen_owner_has_required_fields():
    owner = gen_owner(1)
    assert "name" in owner
    assert "email" in owner
    assert "password" in owner
    assert "phoneNumber" in owner


def test_gen_owner_email_is_unique_per_index():
    a = gen_owner(1)
    b = gen_owner(2)
    assert a["email"].endswith("@seed.dev")
    assert b["email"].endswith("@seed.dev")
    assert a["password"] != b["password"]


def test_gen_owner_password_meets_requirements():
    pw = gen_owner(7)["password"]
    assert any(c.isupper() for c in pw)
    assert any(c.islower() for c in pw)
    assert any(c.isdigit() for c in pw)


def test_gen_shop_has_required_fields():
    shop = gen_shop(1)
    assert "shopName" in shop
    assert "phoneNumber" in shop
    assert len(shop["shopName"]) > 0


def test_gen_product_has_required_fields():
    product = gen_product(1, 1)
    assert "name" in product
    assert "imageUrl" in product
    assert "price" in product
    assert "description" in product


def test_gen_product_image_url_is_picsum():
    product = gen_product(5, 2)
    assert product["imageUrl"].startswith("https://picsum.photos/seed/")


def test_gen_product_price_in_range():
    for i in range(20):
        price = gen_product(i, 1)["price"]
        assert 1.0 <= price <= 999.99


def test_gen_shop_user_has_required_fields():
    user = gen_shop_user(1, "shop-uuid-123")
    assert "email" in user
    assert "password" in user
    assert user["shopId"] == "shop-uuid-123"


def test_gen_shop_user_password_meets_requirements():
    pw = gen_shop_user(3, "shop-uuid-123")["password"]
    assert any(c.isupper() for c in pw)
    assert any(c.islower() for c in pw)
    assert any(c.isdigit() for c in pw)
