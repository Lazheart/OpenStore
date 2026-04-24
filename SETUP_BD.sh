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

cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
	cp .env.example .env
fi

docker compose up -d postgres mysql mongo

DB_HOST="$(ip -4 route get 1.1.1.1 | awk '{print $7; exit}')"
AWS_REGION_VALUE="${AWS_REGION:-us-east-1}"

if command -v aws >/dev/null 2>&1; then
	ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)"
else
	ACCOUNT_ID=""
fi

if [ -n "$ACCOUNT_ID" ]; then
	BUCKET_NAME_VALUE="openstore-images-$ACCOUNT_ID"
else
	BUCKET_NAME_VALUE="openstore-images-CHANGE_ME"
fi

cat > .env.api.generated <<EOF
# Generado por SETUP_BD.sh
POSTGRES_HOST=$DB_HOST
MYSQL_HOST=$DB_HOST
MONGO_HOST=$DB_HOST
DATABASE_URL=jdbc:postgresql://$DB_HOST:5432/openstoredb
SHOP_DATABASE_URL=mysql://shopuser:shoppass@$DB_HOST:3306/shopdb
MONGO_URI=mongodb://$DB_HOST:27017/productdb
BUCKET_NAME=$BUCKET_NAME_VALUE
AWS_REGION=$AWS_REGION_VALUE
EOF

echo
echo "BD levantada correctamente."
echo "Comparte estos valores en la VM de APIs (o copia backend/.env.api.generated):"
cat .env.api.generated
echo
echo "Bloque rapido para copiar/pegar en la VM de APIs:"
echo "-----------------------------------------------"
awk 'BEGIN {print "set -a"} !/^#/ {print "export "$0} END {print "set +a"}' .env.api.generated
echo "-----------------------------------------------"
echo "Luego ejecuta:"
echo "./SETUP_API.sh"
