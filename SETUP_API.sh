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

if [ ! -w "$BACKEND_DIR" ]; then
	echo "Sin permisos de escritura en $BACKEND_DIR" >&2
	echo "Ejecuta: sudo chown -R $USER:$USER $REPO_DIR" >&2
	echo "Luego vuelve a correr este script sin sudo." >&2
	exit 1
fi

DB_HOST="${1:-${DB_HOST:-${POSTGRES_HOST:-}}}"
if [ -z "$DB_HOST" ]; then
	echo "Uso: ./SETUP_API.sh <DB_PRIVATE_IP>" >&2
	echo "Tambien puedes exportar DB_HOST o POSTGRES_HOST" >&2
	exit 1
fi

POSTGRES_HOST_VALUE="${POSTGRES_HOST:-$DB_HOST}"
MYSQL_HOST_VALUE="${MYSQL_HOST:-$DB_HOST}"
MONGO_HOST_VALUE="${MONGO_HOST:-$DB_HOST}"

DATABASE_URL_VALUE="${DATABASE_URL:-jdbc:postgresql://${POSTGRES_HOST_VALUE}:5432/openstoredb}"
SHOP_DATABASE_URL_VALUE="${SHOP_DATABASE_URL:-mysql://shopuser:shoppass@${MYSQL_HOST_VALUE}:3306/shopdb}"
MONGO_URI_VALUE="${MONGO_URI:-mongodb://${MONGO_HOST_VALUE}:27017/productdb}"

extract_port() {
	local uri="$1"
	local default_port="$2"
	local port
	port="$(printf '%s' "$uri" | sed -nE 's#.*:([0-9]+)(/.*)?$#\1#p')"
	if [ -z "$port" ]; then
		echo "$default_port"
	else
		echo "$port"
	fi
}

POSTGRES_PORT_VALUE="$(extract_port "$DATABASE_URL_VALUE" "5432")"
MYSQL_PORT_VALUE="$(extract_port "$SHOP_DATABASE_URL_VALUE" "3306")"
MONGO_PORT_VALUE="$(extract_port "$MONGO_URI_VALUE" "27017")"

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
	if [ -f ".env.example" ]; then
		echo "No existe backend/.env. Se encontro backend/.env.example y se creara backend/.env desde ahi."
		cp .env.example .env
	else
		echo "No existe backend/.env ni backend/.env.example" >&2
		echo "Crea uno de esos archivos antes de ejecutar SETUP_API.sh" >&2
		exit 1
	fi
else
	echo "Se usara backend/.env existente."
fi

if [ ! -w ".env" ]; then
	echo "No hay permisos para escribir en $BACKEND_DIR/.env" >&2
	echo "Ejecuta: sudo chown -R $USER:$USER $REPO_DIR" >&2
	echo "Luego vuelve a correr este script sin sudo." >&2
	exit 1
fi

sed -i "s/^POSTGRES_HOST=.*/POSTGRES_HOST=$POSTGRES_HOST_VALUE/" .env
sed -i "s/^MYSQL_HOST=.*/MYSQL_HOST=$MYSQL_HOST_VALUE/" .env
sed -i "s/^MONGO_HOST=.*/MONGO_HOST=$MONGO_HOST_VALUE/" .env
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL_VALUE|" .env
sed -i "s|^SHOP_DATABASE_URL=.*|SHOP_DATABASE_URL=$SHOP_DATABASE_URL_VALUE|" .env
sed -i "s|^MONGO_URI=.*|MONGO_URI=$MONGO_URI_VALUE|" .env
sed -i "s|^BUCKET_NAME=.*|BUCKET_NAME=$BUCKET_NAME_VALUE|" .env
sed -i "s|^AWS_REGION=.*|AWS_REGION=$AWS_REGION_VALUE|" .env

echo "Valores usados para las APIs:"
echo "DB_HOST=$DB_HOST"
echo "BUCKET_NAME=$BUCKET_NAME_VALUE"
echo "AWS_REGION=$AWS_REGION_VALUE"

if command -v nc >/dev/null 2>&1; then
	until nc -z "$POSTGRES_HOST_VALUE" "$POSTGRES_PORT_VALUE"; do echo "Esperando PostgreSQL en $POSTGRES_HOST_VALUE:$POSTGRES_PORT_VALUE..."; sleep 3; done
	until nc -z "$MYSQL_HOST_VALUE" "$MYSQL_PORT_VALUE"; do echo "Esperando MySQL en $MYSQL_HOST_VALUE:$MYSQL_PORT_VALUE..."; sleep 3; done
	until nc -z "$MONGO_HOST_VALUE" "$MONGO_PORT_VALUE"; do echo "Esperando Mongo en $MONGO_HOST_VALUE:$MONGO_PORT_VALUE..."; sleep 3; done
fi

# En la VM de APIs, docker-compose.yml contiene solo servicios de API
docker compose up -d user-service shop-service product-service

echo
echo "APIs levantadas con DB_HOST=$DB_HOST"
echo "Bucket configurado: $BUCKET_NAME_VALUE"
echo "User service: puerto 8080"
echo "Shop service: puerto 8081"
echo "Product service: puerto 8082 (y 80 para root)"
