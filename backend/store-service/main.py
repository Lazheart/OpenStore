from typing import Any
import os
import time

import boto3
import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from mapping import (
	AuthLoginRequest,
	AuthRegisterRequest,
	ShopCreateRequest,
	ShopUpdateRequest,
	build_register_payload,
	build_shop_create_payload,
	build_shop_update_payload,
	resolved_shop_id,
)
from services_paths import (
	shop_create_url,
	shop_get_by_id_url,
	shop_get_by_name_url,
	product_delete_url,
	product_purge_by_shop_url,
	shop_internal_delete_url,
	shop_update_url,
	user_me_url,
	user_auth_login_url,
	user_auth_register_url,
	shop_list_url,
	product_list_by_shop_url,
	product_create_url,
	product_update_url,
)

ATHENA_DATABASE = os.getenv("ATHENA_DATABASE", "openstore_catalog")
ATHENA_RESULTS_BUCKET = os.getenv("ATHENA_RESULTS_BUCKET", "s3://openstore-ingest-637423414138/athena-results/")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


def _run_athena_query(sql: str) -> list[dict]:
	client = boto3.client(
		"athena",
		region_name=AWS_REGION,
		aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
		aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
		aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
	)
	response = client.start_query_execution(
		QueryString=sql,
		QueryExecutionContext={"Database": ATHENA_DATABASE},
		ResultConfiguration={"OutputLocation": ATHENA_RESULTS_BUCKET},
	)
	execution_id = response["QueryExecutionId"]
	for _ in range(30):
		status = client.get_query_execution(QueryExecutionId=execution_id)
		state = status["QueryExecution"]["Status"]["State"]
		if state == "SUCCEEDED":
			break
		if state in ("FAILED", "CANCELLED"):
			reason = status["QueryExecution"]["Status"].get("StateChangeReason", "")
			raise HTTPException(status_code=500, detail=f"Athena query failed: {reason}")
		time.sleep(1)
	else:
		raise HTTPException(status_code=504, detail="Athena query timeout")

	results = client.get_query_results(QueryExecutionId=execution_id)
	rows = results["ResultSet"]["Rows"]
	if len(rows) < 2:
		return []
	headers = [col["VarCharValue"] for col in rows[0]["Data"]]
	return [
		{headers[i]: col.get("VarCharValue", "") for i, col in enumerate(row["Data"])}
		for row in rows[1:]
	]


_OPENAPI_TAGS_METADATA = [
	{"name": "Salud", "description": "Comprobaciones de vida del servicio."},
	{"name": "Analytics", "description": "Consultas analíticas sobre el Data Lake en AWS Athena."},
	{
		"name": "Auth",
		"description": (
			"Autenticación centralizada: según `shopId` en el cuerpo se enruta a "
			"OWNER (`/api/auth/...`) o a usuario de tienda (`/api/auth/{shopId}/...`)."
		),
	},
	{"name": "Tiendas", "description": "Creación, lectura y actualización de tiendas vía shop-service."},
	{
		"name": "Productos",
		"description": "Eliminación orquestada; delega en product-service.",
	},
	{"name": "Utilidades", "description": "Resolución owner/tienda y meta documentación."},
]

app = FastAPI(
	title="OpenStore Store Service",
	description=(
		"**Orquestador del frontend**: un único punto de entrada HTTP que enruta hacia "
		"user-service, shop-service y product-service; coordina "
		"operaciones que delegan en otros servicios de forma secuencial.\n\n"
		"- **Registro/login**: sin `shopId` se asume rol **OWNER**; con `shopId`, usuario de esa tienda.\n"
		"- **Swagger del gateway**: ruta `/docs`. Enlaces a la documentación de cada microservicio: `/docs/mappings`."
	),
	version="1.0.0",
	openapi_tags=_OPENAPI_TAGS_METADATA,
	docs_url="/docs",
	redoc_url="/redoc",
	openapi_url="/openapi.json",
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Templates folder (relative to store-service/)
templates = Jinja2Templates(directory="templates")


def _build_auth_headers(authorization: str | None = None) -> dict[str, str]:
	headers: dict[str, str] = {"Content-Type": "application/json"}
	if authorization:
		headers["Authorization"] = authorization
	return headers


async def _forward(
	method: str,
	url: str,
	payload: dict[str, Any] | None = None,
	authorization: str | None = None,
) -> Any:
	try:
		async with httpx.AsyncClient() as client:
			response = await client.request(
				method=method,
				url=url,
				headers=_build_auth_headers(authorization),
				json=payload,
			)
	except httpx.RequestError as exc:
		raise HTTPException(status_code=502, detail=f"Error de conexion con servicio externo: {exc}") from exc

	if response.status_code >= 400:
		try:
			detail = response.json()
		except ValueError:
			detail = {"error": response.text}
		raise HTTPException(status_code=response.status_code, detail=detail)

	if not response.text:
		return None

	try:
		return response.json()
	except ValueError:
		return {"message": response.text}


async def _resolve_current_user(authorization: str | None) -> dict[str, Any]:
	if not authorization:
		raise HTTPException(status_code=401, detail="Acceso denegado. Token no proporcionado.")

	user = await _forward("GET", user_me_url(), authorization=authorization)
	if not isinstance(user, dict) or user.get("id") is None:
		raise HTTPException(status_code=400, detail="No se pudo obtener el usuario autenticado")

	return user


@app.get("/", tags=["Salud"])
def root() -> dict[str, str]:
	return {"service": "store-service", "role": "orchestrator", "status": "ok"}


@app.get("/health", tags=["Salud"])
def health() -> dict[str, str]:
	return {"status": "ok"}


@app.get(
	"/me",
	tags=["Auth"],
	summary="Perfil del usuario actual",
	description="Reenvía al user-service (`GET /me`) con el mismo encabezado Authorization.",
)
async def me(authorization: str | None = Header(default=None)) -> Any:
	if not authorization:
		raise HTTPException(status_code=401, detail="Acceso denegado. Token no proporcionado.")

	return await _forward("GET", user_me_url(), authorization=authorization)


@app.post(
	"/auth/login",
	tags=["Auth"],
	summary="Inicio de sesión",
	description=(
		"Sin `shopId`: login OWNER. Con `shopId`: login como usuario de esa tienda. "
		"El cuerpo se reenvía al user-service."
	),
)
async def auth_login(payload: AuthLoginRequest) -> Any:
	target_url = user_auth_login_url(resolved_shop_id(payload.shopId))
	body = {
		"identifier": payload.identifier,
		"password": payload.password,
	}
	return await _forward("POST", target_url, payload=body)


@app.post(
	"/auth/register",
	tags=["Auth"],
	summary="Registro",
	description=(
		"Sin `shopId` se enruta a registro **OWNER**. Con `shopId`, a registro de usuario de tienda. "
		"Los campos del cuerpo se adaptan al DTO esperado por user-service."
	),
)
async def auth_register(payload: AuthRegisterRequest) -> Any:
	target_url = user_auth_register_url(resolved_shop_id(payload.shopId))
	body = build_register_payload(payload)
	return await _forward("POST", target_url, payload=body)


@app.post(
	"/openshop/shop",
	status_code=201,
	tags=["Tiendas"],
	summary="Crear tienda",
	description="Proxy a shop-service; validación de rol/plan en el origen.",
)
async def create_shop(payload: ShopCreateRequest, authorization: str | None = Header(default=None)) -> Any:
	# Shop-service aplica las reglas de rol, plan y unicidad del nombre.
	return await _forward(
		"POST",
		shop_create_url(),
		payload=build_shop_create_payload(payload),
		authorization=authorization,
	)


@app.get("/shop/name/{shop_name}", tags=["Tiendas"])
async def get_shop_by_name(shop_name: str) -> Any:
	return await _forward("GET", shop_get_by_name_url(shop_name))


@app.patch("/shop/id/{shop_id}", tags=["Tiendas"])
async def update_shop(
	shop_id: str,
	payload: ShopUpdateRequest,
	authorization: str | None = Header(default=None),
) -> Any:
	return await _forward(
		"PATCH",
		shop_update_url(shop_id),
		payload=build_shop_update_payload(payload),
		authorization=authorization,
	)


@app.delete(
	"/shop/id/{shop_id}",
	tags=["Tiendas"],
	summary="Solicitar borrado de tienda",
	description="Verifica ownership y borra productos y tienda mediante llamadas HTTP síncronas.",
)
async def delete_shop(shop_id: str, authorization: str | None = Header(default=None)) -> Any:
	user = await _resolve_current_user(authorization)
	shop = await _forward("GET", shop_get_by_id_url(shop_id))

	if not isinstance(shop, dict) or shop.get("ownerId") is None:
		raise HTTPException(status_code=404, detail="Tienda no encontrada")

	shop_owner_id_raw = shop.get("ownerId")
	user_id_raw = user.get("id")
	try:
		shop_owner_id = str(shop_owner_id_raw)
		user_id = str(user_id_raw)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail="No se pudo validar ownership de la tienda") from exc

	if shop_owner_id != user_id:
		raise HTTPException(status_code=403, detail="No puedes eliminar una tienda que no te pertenece")

	headers = {"Content-Type": "application/json"}
	async with httpx.AsyncClient() as client:
		purge_response = await client.delete(product_purge_by_shop_url(shop_id), headers=headers)
		if purge_response.status_code not in {200, 404}:
			raise HTTPException(
				status_code=purge_response.status_code,
				detail=f"No se pudieron purgar productos de la tienda {shop_id}",
			)

		delete_response = await client.delete(shop_internal_delete_url(shop_id), headers=headers)
		if delete_response.status_code not in {200, 404}:
			raise HTTPException(
				status_code=delete_response.status_code,
				detail=f"No se pudo eliminar la tienda {shop_id}",
			)

	return {"status": "accepted", "shopId": shop_id}


@app.get("/shops", tags=["Tiendas"])
async def get_shops(page: int = 1, limit: int = 10, authorization: str | None = Header(default=None)) -> Any:
	return await _forward("GET", shop_list_url(page, limit), authorization=authorization)


@app.get("/shops/{shop_id}", tags=["Tiendas"])
async def get_shop(shop_id: str, authorization: str | None = Header(default=None)) -> Any:
	return await _forward("GET", shop_get_by_id_url(shop_id), authorization=authorization)


@app.get("/shops/{shop_id}/products", tags=["Productos"])
async def get_products_by_shop(shop_id: str, authorization: str | None = Header(default=None)) -> Any:
	return await _forward("GET", product_list_by_shop_url(shop_id), authorization=authorization)


@app.post("/shops/{shop_id}/products", status_code=201, tags=["Productos"])
async def create_product_route(shop_id: str, request: Request, authorization: str | None = Header(default=None)) -> Any:
	body = await request.body()
	headers = {}
	if authorization:
		headers["Authorization"] = authorization
	content_type = request.headers.get("content-type")
	if content_type:
		headers["Content-Type"] = content_type

	try:
		async with httpx.AsyncClient() as client:
			response = await client.request(
				method="POST",
				url=product_create_url(shop_id),
				headers=headers,
				content=body,
			)
	except httpx.RequestError as exc:
		raise HTTPException(status_code=502, detail=f"Error de conexion con servicio externo: {exc}") from exc

	if response.status_code >= 400:
		try:
			detail = response.json()
		except ValueError:
			detail = {"error": response.text}
		raise HTTPException(status_code=response.status_code, detail=detail)

	if not response.text:
		return None

	try:
		return response.json()
	except ValueError:
		return {"message": response.text}


@app.patch("/shops/{shop_id}/products/{product_id}", tags=["Productos"])
async def update_product_route(shop_id: str, product_id: str, request: Request, authorization: str | None = Header(default=None)) -> Any:
	body = await request.body()
	headers = {}
	if authorization:
		headers["Authorization"] = authorization
	content_type = request.headers.get("content-type")
	if content_type:
		headers["Content-Type"] = content_type

	try:
		async with httpx.AsyncClient() as client:
			response = await client.request(
				method="PATCH",
				url=product_update_url(shop_id, product_id),
				headers=headers,
				content=body,
			)
	except httpx.RequestError as exc:
		raise HTTPException(status_code=502, detail=f"Error de conexion con servicio externo: {exc}") from exc

	if response.status_code >= 400:
		try:
			detail = response.json()
		except ValueError:
			detail = {"error": response.text}
		raise HTTPException(status_code=response.status_code, detail=detail)

	if not response.text:
		return None

	try:
		return response.json()
	except ValueError:
		return {"message": response.text}


@app.delete(
	"/shops/{shop_id}/products/{product_id}",
	status_code=204,
	tags=["Productos"],
	summary="Eliminar producto",
	description="Solo necesitas `shop_id` y `product_id` en la ruta y el token Bearer.",
)
async def delete_product(shop_id: str, product_id: str, authorization: str | None = Header(default=None)) -> None:
	if not authorization:
		raise HTTPException(status_code=401, detail="Acceso denegado. Token no proporcionado.")

	await _forward("DELETE", product_delete_url(shop_id, product_id), authorization=authorization)


@app.get("/shop/id/{shop_id}/owner", tags=["Utilidades"])
async def get_owner_by_shop_id(shop_id: str) -> dict[str, str]:
	shop_data = await _forward("GET", shop_get_by_id_url(shop_id))

	owner_id = shop_data.get("ownerId") if isinstance(shop_data, dict) else None
	if owner_id is None:
		raise HTTPException(status_code=404, detail="No se pudo resolver ownerId para la tienda")

	return {"shopId": shop_id, "ownerId": str(owner_id)}


@app.get("/analytics/productos-por-tienda", tags=["Analytics"], summary="Top tiendas por número de productos")
async def analytics_productos_por_tienda():
	sql = """
		SELECT s.name AS shop_name,
		       COUNT(DISTINCT p.id) AS total_products
		FROM shops_data s
		LEFT JOIN products p ON p.shopid = s.id
		GROUP BY s.name
		ORDER BY total_products DESC
		LIMIT 20
	"""
	return _run_athena_query(sql)


@app.get("/analytics/usuarios-por-tienda", tags=["Analytics"], summary="Usuarios asignados por tienda")
async def analytics_usuarios_por_tienda():
	sql = """
		SELECT s.name AS shop_name,
		       COUNT(DISTINCT u.id) AS total_users
		FROM shops_data s
		LEFT JOIN users u ON u.shop_id = s.id
		GROUP BY s.name
		ORDER BY total_users DESC
		LIMIT 20
	"""
	return _run_athena_query(sql)


@app.get("/analytics/membresias-por-tienda", tags=["Analytics"], summary="Membresías por tienda")
async def analytics_membresias_por_tienda():
	sql = """
		SELECT s.name AS shop_name,
		       COUNT(m.id) AS total_memberships
		FROM shops_data s
		LEFT JOIN memberships_data m ON m.shop_id = s.id
		GROUP BY s.name
		ORDER BY total_memberships DESC
		LIMIT 20
	"""
	return _run_athena_query(sql)


@app.get("/analytics/resumen-tiendas", tags=["Analytics"], summary="Resumen completo por tienda")
async def analytics_resumen_tiendas():
	sql = """
		SELECT shop_name, total_products, total_users
		FROM v_tienda_resumen
		ORDER BY total_products DESC
		LIMIT 20
	"""
	return _run_athena_query(sql)


@app.get("/docs/mappings", response_class=HTMLResponse, tags=["Utilidades"], include_in_schema=False)
async def docs_mappings(request: Request) -> HTMLResponse:
	"""Página HTML con enlaces a la documentación OpenAPI/Swagger de cada microservicio."""
	from services_paths import SHOP_SERVICE_URL, PRODUCT_SERVICE_URL, USER_SERVICE_URL

	store_public_url = str(request.base_url).rstrip("/")
	services = [
		{
			"name": "Store Service (este orquestador)",
			"url": f"{store_public_url}/docs",
			"note": "Swagger del gateway; el contrato que debe usar el frontend.",
		},
		{"name": "Shop Service", "url": f"{SHOP_SERVICE_URL}/api-docs", "note": "API interna de tiendas"},
		{"name": "Product Service", "url": f"{PRODUCT_SERVICE_URL}/docs", "note": "API interna de productos"},
		{
			"name": "User Service",
			"url": f"{USER_SERVICE_URL}/swagger-ui/index.html",
			"note": "Usuarios y auth (Spring)",
		},
	]

	return templates.TemplateResponse("docs.html", {"request": request, "services": services})
