import asyncio
import os
import random
import sys

from dotenv import load_dotenv
from faker import Faker
import httpx

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
STORE_SERVICE_URL = os.getenv("STORE_SERVICE_URL")
if not STORE_SERVICE_URL:
    sys.exit(
        "ERROR: STORE_SERVICE_URL no está configurada.\n"
        "Copia .env.example a .env, completa la URL del store-service y vuelve a correr."
    )

NUM_SHOPS = int(os.getenv("NUM_SHOPS", "10"))
PRODUCTS_PER_SHOP = int(os.getenv("PRODUCTS_PER_SHOP", "200"))
USERS_PER_SHOP = int(os.getenv("USERS_PER_SHOP", "100"))
CONCURRENCY = int(os.getenv("CONCURRENCY", "20"))

fake = Faker("es")

# ---------------------------------------------------------------------------
# Data generators
# ---------------------------------------------------------------------------

def gen_owner(i: int) -> dict:
    return {
        "name": fake.name(),
        "email": f"owner{i}_{fake.uuid4()[:8]}@seed.dev",
        "password": f"Seed1234!{i}",
        "phoneNumber": fake.phone_number()[:15],
    }


def gen_shop(i: int) -> dict:
    return {
        "shopName": f"{fake.company()} #{i}",
        "phoneNumber": fake.phone_number()[:15],
    }


def gen_product(i: int, shop_i: int) -> dict:
    return {
        "name": fake.catch_phrase(),
        "imageUrl": f"https://picsum.photos/seed/{shop_i * 1000 + i}/400/400",
        "price": round(random.uniform(1.0, 999.99), 2),
        "description": fake.sentence(),
    }


def gen_shop_user(i: int, shop_id: str) -> dict:
    return {
        "email": f"user{i}_{fake.uuid4()[:8]}@seed.dev",
        "password": f"Seed1234!{i}",
        "shopId": shop_id,
    }
