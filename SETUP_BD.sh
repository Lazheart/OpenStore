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

if grep -q '\${AWS::AccountId}' .env; then
	echo "Detectado placeholder invalido en backend/.env para BUCKET_NAME. Corrigiendo a un valor local..."
	sed -i 's|^BUCKET_NAME=.*|BUCKET_NAME=openstore-images-local|' .env
fi

get_env_value() {
	local key="$1"
	local default_value="$2"
	local value
	value="$(grep -E "^${key}=" .env | tail -n1 | cut -d'=' -f2- || true)"
	if [ -z "$value" ]; then
		echo "$default_value"
	else
		echo "$value"
	fi
}

is_port_busy() {
	local port="$1"
	if command -v ss >/dev/null 2>&1; then
		ss -lnt "( sport = :${port} )" 2>/dev/null | awk 'NR>1 {print}' | grep -q .
		return
	fi

	if command -v lsof >/dev/null 2>&1; then
		lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
		return
	fi

	return 1
}

next_free_port() {
	local start_port="$1"
	local port="$start_port"

	while is_port_busy "$port"; do
		port=$((port + 1))
	done

	echo "$port"
}

POSTGRES_PORT_VALUE="$(get_env_value POSTGRES_PORT 5432)"
MYSQL_PORT_VALUE="$(get_env_value MYSQL_PORT 3306)"
MONGO_PORT_VALUE="$(get_env_value MONGO_PORT 27017)"

POSTGRES_PORT_RESOLVED="$(next_free_port "$POSTGRES_PORT_VALUE")"
MYSQL_PORT_RESOLVED="$(next_free_port "$MYSQL_PORT_VALUE")"
MONGO_PORT_RESOLVED="$(next_free_port "$MONGO_PORT_VALUE")"

if [ "$POSTGRES_PORT_RESOLVED" != "$POSTGRES_PORT_VALUE" ]; then
	echo "Puerto $POSTGRES_PORT_VALUE ocupado para Postgres. Usando $POSTGRES_PORT_RESOLVED."
	sed -i "s|^POSTGRES_PORT=.*|POSTGRES_PORT=$POSTGRES_PORT_RESOLVED|" .env
	POSTGRES_PORT_VALUE="$POSTGRES_PORT_RESOLVED"
fi

if [ "$MYSQL_PORT_RESOLVED" != "$MYSQL_PORT_VALUE" ]; then
	echo "Puerto $MYSQL_PORT_VALUE ocupado para MySQL. Usando $MYSQL_PORT_RESOLVED."
	sed -i "s|^MYSQL_PORT=.*|MYSQL_PORT=$MYSQL_PORT_RESOLVED|" .env
	MYSQL_PORT_VALUE="$MYSQL_PORT_RESOLVED"
fi

if [ "$MONGO_PORT_RESOLVED" != "$MONGO_PORT_VALUE" ]; then
	echo "Puerto $MONGO_PORT_VALUE ocupado para Mongo. Usando $MONGO_PORT_RESOLVED."
	if grep -q '^MONGO_PORT=' .env; then
		sed -i "s|^MONGO_PORT=.*|MONGO_PORT=$MONGO_PORT_RESOLVED|" .env
	else
		echo "MONGO_PORT=$MONGO_PORT_RESOLVED" >> .env
	fi
	MONGO_PORT_VALUE="$MONGO_PORT_RESOLVED"
fi

docker compose up -d postgres mysql mongo

DB_HOST="$(ip -4 route get 1.1.1.1 | awk '{print $7; exit}')"
AWS_REGION_VALUE="${AWS_REGION:-${AWS_DEFAULT_REGION:-$(aws configure get region 2>/dev/null || true)}}"
if [ -z "$AWS_REGION_VALUE" ]; then
	AWS_REGION_VALUE="us-east-1"
fi

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
DATABASE_URL=jdbc:postgresql://$DB_HOST:$POSTGRES_PORT_VALUE/openstoredb
SHOP_DATABASE_URL=mysql://shopuser:shoppass@$DB_HOST:$MYSQL_PORT_VALUE/shopdb
MONGO_URI=mongodb://$DB_HOST:$MONGO_PORT_VALUE/productdb
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
