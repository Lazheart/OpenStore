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

ENV_GENERATED_FILE="${ENV_GENERATED_FILE:-$BACKEND_DIR/.env.api.generated}"

# Prioridad de origen de valores:
# 1) argumento DB host
# 2) variables exportadas del shell
# 3) archivo generado por SETUP_BD.sh
if [ -f "$ENV_GENERATED_FILE" ]; then
	set -a
	# shellcheck disable=SC1090
	source "$ENV_GENERATED_FILE"
	set +a
fi

DB_HOST="${1:-${DB_HOST:-${POSTGRES_HOST:-}}}"
if [ -z "$DB_HOST" ]; then
	echo "Uso: ./SETUP_API.sh <DB_PRIVATE_IP>" >&2
	echo "Tambien puedes exportar DB_HOST o tener $ENV_GENERATED_FILE" >&2
	exit 1
fi

AWS_REGION_VALUE="${AWS_REGION:-us-east-1}"
if command -v aws >/dev/null 2>&1; then
	ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)"
else
	ACCOUNT_ID=""
fi

if [ -n "$ACCOUNT_ID" ]; then
	BUCKET_NAME_VALUE="openstore-images-$ACCOUNT_ID"
else
	BUCKET_NAME_VALUE="${BUCKET_NAME:-openstore-images-CHANGE_ME}"
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
sed -i "s|^BUCKET_NAME=.*|BUCKET_NAME=$BUCKET_NAME_VALUE|" .env
sed -i "s|^AWS_REGION=.*|AWS_REGION=$AWS_REGION_VALUE|" .env

echo "Valores usados para las APIs:"
echo "DB_HOST=$DB_HOST"
echo "BUCKET_NAME=$BUCKET_NAME_VALUE"
echo "AWS_REGION=$AWS_REGION_VALUE"

if command -v nc >/dev/null 2>&1; then
	until nc -z "$DB_HOST" 5432; do echo "Esperando PostgreSQL en $DB_HOST:5432..."; sleep 3; done
	until nc -z "$DB_HOST" 3306; do echo "Esperando MySQL en $DB_HOST:3306..."; sleep 3; done
	until nc -z "$DB_HOST" 27017; do echo "Esperando Mongo en $DB_HOST:27017..."; sleep 3; done
fi

# No inicia dependencias locales (postgres/mysql/mongo) en la VM de APIs
docker compose up -d --no-deps user-service shop-service product-service

echo
echo "APIs levantadas con DB_HOST=$DB_HOST"
echo "Bucket configurado: $BUCKET_NAME_VALUE"
echo "User service: puerto 8080"
echo "Shop service: puerto 8081"
echo "Product service: puerto 8082 (y 80 para root)"
