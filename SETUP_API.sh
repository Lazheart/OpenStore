#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"
BACKEND_DIR="$REPO_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
	echo "No se encontro backend en $BACKEND_DIR" >&2
	exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker no esta instalado. Instala docker.io y docker-compose-plugin primero." >&2
	exit 1
fi

DB_HOST="${1:-${DB_HOST:-}}"
if [ -z "$DB_HOST" ]; then
	echo "Uso: ./SETUP_API.sh <DB_PRIVATE_IP>" >&2
	echo "Tambien puedes exportar DB_HOST y ejecutar sin argumentos." >&2
	exit 1
fi

cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
	cp .env.example .env
fi

sed -i "s/^POSTGRES_HOST=.*/POSTGRES_HOST=$DB_HOST/" .env
sed -i "s/^MYSQL_HOST=.*/MYSQL_HOST=$DB_HOST/" .env
sed -i "s/^MONGO_HOST=.*/MONGO_HOST=$DB_HOST/" .env
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=jdbc:postgresql://$DB_HOST:5432/openstoredb|" .env
sed -i "s|^SHOP_DATABASE_URL=.*|SHOP_DATABASE_URL=mysql://shopuser:shoppass@$DB_HOST:3306/shopdb|" .env
sed -i "s|^MONGO_URI=.*|MONGO_URI=mongodb://$DB_HOST:27017/productdb|" .env

if command -v nc >/dev/null 2>&1; then
	until nc -z "$DB_HOST" 5432; do echo "Esperando PostgreSQL en $DB_HOST:5432..."; sleep 3; done
	until nc -z "$DB_HOST" 3306; do echo "Esperando MySQL en $DB_HOST:3306..."; sleep 3; done
	until nc -z "$DB_HOST" 27017; do echo "Esperando Mongo en $DB_HOST:27017..."; sleep 3; done
fi

docker compose up -d user-service shop-service product-service

echo
echo "APIs levantadas con DB_HOST=$DB_HOST"
echo "User service: puerto 8080"
echo "Shop service: puerto 8081"
echo "Product service: puerto 8082 (y 80 para root)"
