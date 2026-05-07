# OpenStore — DataIngest Pipeline

Pipeline ETL completo para poblar las bases de datos de OpenStore con datos de prueba realistas y exponerlos en AWS para análisis con Athena.

---

## Arquitectura general

```
Bases de Datos (App-1 EC2)
  ├── PostgreSQL :5432  → userdb      (usuarios, owners)
  ├── MySQL      :3307  → shopdb      (tiendas, membresías)
  └── MongoDB    :27017 → productdb   (productos)
         │
         │  [MV-Ingesta EC2]
         │  seed.py  →  pobla las 3 BDs
         │  docker-compose (ingest-users / ingest-shops / ingest-products)
         │       └── extrae datos → genera CSV/JSON → sube a S3
         ▼
  S3: openstore-ingest-<account-id>/
  ├── users/users.csv
  ├── shops/shops.csv
  ├── shops/memberships.csv
  └── products/products.json   (JSON Lines — un objeto por línea)
         │
         │  AWS Glue Crawlers
         │       └── detectan esquema → crean tablas en Data Catalog
         ▼
  Glue Data Catalog: openstore_catalog
  ├── users
  ├── shops_csv
  ├── memberships_csv
  └── products
         │
         │  Amazon Athena
         ▼
  Queries SQL + Vistas analíticas
```

---

## Infraestructura AWS

| Recurso | Descripción |
|---|---|
| **App-1** (MV-OpenShop-App-1) | EC2 con Docker. Corre los 3 contenedores de BD y los 4 servicios de la app. IP privada: `172.31.11.149` |
| **MV-Ingesta** | EC2 Amazon Linux 2023. Corre el seed y los contenedores de ingesta. IP privada: `172.31.47.89` |
| **S3** | Bucket `openstore-ingest-<account-id>`. Almacena los archivos extraídos |
| **Glue** | Base de datos `openstore_catalog` con 3 crawlers |
| **Athena** | Motor SQL sobre S3. Output en `s3://openstore-ingest-<account-id>/athena-results/` |

---

## Datos generados

| Entidad | Cantidad | Destino |
|---|---|---|
| Tiendas (shops) | 100 | MySQL → S3 → Glue |
| Owners | 100 (1 por tienda) | PostgreSQL → S3 → Glue |
| Usuarios normales | 5,000 (50 por tienda) | PostgreSQL → S3 → Glue |
| Membresías | 5,100 (owners + usuarios) | MySQL → S3 → Glue |
| Productos | 20,000 (200 por tienda) | MongoDB → S3 → Glue |
| **Total registros** | **30,300** | |

---

## Paso 1 — Levantar bases de datos en App-1

Las BDs corren como contenedores Docker en App-1. Al reiniciar la instancia EC2 hay que levantarlas manualmente.

```bash
# En App-1
cd ~/OpenStore/database
docker compose up -d

# Verificar que los 3 contenedores estén corriendo
docker ps --format "table {{.Names}}\t{{.Status}}"
# Debe mostrar: mongodb, mysql-db, postgres-db → Up
```

El archivo `database/docker-compose.yml` expone:
- PostgreSQL en puerto `5432`
- MySQL en puerto `3307`
- MongoDB en puerto `27017`

---

## Paso 2 — Poblar las bases de datos (seed)

El seed se ejecuta desde **MV-Ingesta** y conecta a App-1 vía IP privada.

```bash
# En MV-Ingesta
cd ~/OpenStore/DataIngest
git pull origin DataIngest
pip3 install -r requirements.txt
python3 seed.py
```

### Variables de entorno usadas por seed.py

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `POSTGRES_HOST` | `172.31.11.149` | IP privada de App-1 |
| `MYSQL_HOST` | `172.31.11.149` | IP privada de App-1 |
| `MONGO_URI` | `mongodb://admin:admin123@172.31.11.149:27017/productdb?authSource=admin` | URI completa con authSource |
| `NUM_SHOPS` | `100` | Número de tiendas |
| `PRODUCTS_PER_SHOP` | `200` | Productos por tienda |
| `USERS_PER_SHOP` | `100` | Usuarios por tienda |

### Qué hace seed.py

1. **PostgreSQL**: Inserta owners (`owner{N}@openstore.seed`) y usuarios normales (`user{N}@openstore.seed`). Password para todos: `OpenStore1!`. Usa `ON CONFLICT (email) DO NOTHING` — seguro de correr múltiples veces.

2. **MySQL**: Crea las tablas `Shop` y `Membership` si no existen (`CREATE TABLE IF NOT EXISTS`), luego inserta con `INSERT IGNORE` — seguro de correr múltiples veces.

3. **MongoDB**: Inserta productos directamente con `insert_many`. **Importante**: si se corre el seed más de una vez, MongoDB acumula documentos duplicados porque no tiene constraint de unicidad. Limpiar la colección antes de re-correr si es necesario.

### Output esperado

```
Password para todos los usuarios: OpenStore1!
Generando 100 tiendas, 200 productos/tienda, 50 usuarios/tienda...

[1/3] Insertando usuarios en PostgreSQL...
  ✓ 5100 usuarios insertados

[2/3] Insertando tiendas en MySQL...
  ✓ 100 tiendas y 5100 membresías insertadas

[3/3] Insertando productos en MongoDB...
  ✓ 20000 productos insertados

=============================================
Resumen final:
  Tiendas:          100
  Owners:           100
  Usuarios normales:5000
  Membresías:       5100
  Productos:        20000
  Total registros:  30300
=============================================
```

---

## Paso 3 — Contenedores de ingesta (extracción a S3)

Tres contenedores Docker extraen los datos de cada BD y los suben a S3.

### Prerequisito: credenciales AWS

AWS Academy genera credenciales temporales (tipo `ASIA...`) que expiran cuando se cierra la sesión. **Deben actualizarse en cada nueva sesión** de Academy.

Obtenerlas en: **AWS Academy → AWS Details → AWS CLI** (copiar las 3 líneas).

```bash
# En MV-Ingesta — actualizar .env con las nuevas credenciales
nano ~/OpenStore/DataIngest/.env
```

El `.env` completo en MV-Ingesta debe tener:

```env
POSTGRES_HOST=172.31.11.149
POSTGRES_PORT=5432
POSTGRES_DB=userdb
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123

MYSQL_HOST=172.31.11.149
MYSQL_PORT=3307
MYSQL_DB=shopdb
MYSQL_USER=admin
MYSQL_PASSWORD=admin123

MONGO_URI=mongodb://admin:admin123@172.31.11.149:27017/productdb?authSource=admin
MONGO_DB=productdb

AWS_ACCESS_KEY_ID=ASIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
AWS_REGION=us-east-1
S3_BUCKET=openstore-ingest-637423414138
```

> **Nota**: `AWS_SESSION_TOKEN` es obligatorio cuando las credenciales son temporales (empiezan con `ASIA`). Sin él, el upload a S3 falla con `InvalidAccessKeyId`.

### Instalar Docker Compose en MV-Ingesta

MV-Ingesta (Amazon Linux 2023) no tiene `docker compose` como plugin. Instalar el binario:

```bash
sudo curl -SL "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Correr la ingesta

```bash
cd ~/OpenStore/DataIngest
git pull origin DataIngest
/usr/local/bin/docker-compose up --build
```

### Qué sube cada contenedor

| Contenedor | Fuente | Archivo S3 | Formato |
|---|---|---|---|
| `ingest-users` | PostgreSQL `users` | `users/users.csv` | CSV con header |
| `ingest-shops` | MySQL `Shop` | `shops/shops.csv` | CSV con header |
| `ingest-shops` | MySQL `Membership` | `shops/memberships.csv` | CSV con header |
| `ingest-products` | MongoDB `products` | `products/products.json` | JSON Lines (un objeto por línea) |

> **Importante**: `products.json` usa formato **JSON Lines** (no array JSON). Athena requiere un objeto JSON por línea para leer correctamente el archivo.

### Output esperado

```
ingest-users-1  | ✓ users.csv subido con 5110 registros
ingest-shops-1  | ✓ /tmp/shops.csv subido con 100 registros
ingest-shops-1  | ✓ /tmp/memberships.csv subido con 5100 registros
ingest-products-1 | ✓ products.json subido con 20000 registros
```

---

## Paso 4 — AWS Glue

### 4.1 Crear la base de datos del catálogo

**Glue → Data Catalog → Databases → Add database**
- Name: `openstore_catalog`

### 4.2 Crear los 3 crawlers

**Glue → Crawlers → Create crawler** (repetir 3 veces):

| Crawler | S3 Path | Tablas que crea |
|---|---|---|
| `crawler-users` | `s3://openstore-ingest-637423414138/users/` | `users` |
| `crawler-shops` | `s3://openstore-ingest-637423414138/shops/` | `shops_csv`, `memberships_csv` |
| `crawler-products` | `s3://openstore-ingest-637423414138/products/` | `products` |

Configuración de cada crawler:
- **Data source**: S3 → path indicado arriba
- **Subsequent crawler runs**: Crawl all sub-folders
- **IAM role**: `LabRole` (disponible en AWS Academy)
- **Output database**: `openstore_catalog`

### 4.3 Correr los crawlers

Seleccionar los 3 crawlers → **Run** → esperar estado `Ready`.

> **Nota**: Si un archivo se sube después de que el crawler ya corrió, hay que volver a correr el crawler correspondiente para que actualice el esquema. Si el esquema quedó incorrecto (por ejemplo, columna `array` en products), hay que eliminar la tabla manualmente en Glue → Tables y re-correr el crawler.

---

## Paso 5 — Amazon Athena

### 5.1 Configurar output

**Athena → Query settings → Manage** → Query result location:
```
s3://openstore-ingest-637423414138/athena-results/
```

### 5.2 Esquema de tablas en Athena

Después de correr los crawlers, las tablas tienen estas columnas:

**`users`**
```
id, name, email, phone_number, role, subscription, shop_id,
enabled (boolean), email_verified (boolean), token_version (bigint),
created_at, updated_at
```

**`shops_csv`**
```
id, name, owner_id, phone_number (bigint)
```

**`memberships_csv`**
```
id (bigint), user_id, role, shop_id
```

**`products`**
```
id, name, price (double), description, imageurl, availability, shopid
```

> **Nota**: Glue convierte los nombres de columnas JSON a minúsculas. `shopId` → `shopid`, `imageUrl` → `imageurl`.

### 5.3 Queries de análisis

**Query 1 — Productos con nombre de tienda:**
```sql
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.price,
    p.availability,
    s.name AS shop_name
FROM openstore_catalog.products p
JOIN openstore_catalog.shops_csv s ON p.shopid = s.id
LIMIT 100;
```

**Query 2 — Usuarios con su tienda:**
```sql
SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    u.role,
    s.name AS shop_name
FROM openstore_catalog.users u
LEFT JOIN openstore_catalog.shops_csv s ON u.shop_id = s.id
WHERE u.role = 'USER'
LIMIT 100;
```

**Query 3 — Membresías por tienda:**
```sql
SELECT
    s.name AS shop_name,
    m.user_id,
    m.role AS membership_role
FROM openstore_catalog.memberships_csv m
JOIN openstore_catalog.shops_csv s ON m.shop_id = s.id
ORDER BY s.name
LIMIT 100;
```

**Query 4 — Resumen de productos y usuarios por tienda:**
```sql
SELECT
    s.name AS shop_name,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT u.id) AS total_users
FROM openstore_catalog.shops_csv s
LEFT JOIN openstore_catalog.products p ON p.shopid = s.id
LEFT JOIN openstore_catalog.users u ON u.shop_id = s.id
GROUP BY s.name
ORDER BY total_products DESC
LIMIT 50;
```

### 5.4 Vistas

**Vista 1 — Resumen por tienda:**
```sql
CREATE OR REPLACE VIEW openstore_catalog.v_tienda_resumen AS
SELECT
    s.id AS shop_id,
    s.name AS shop_name,
    s.phone_number,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT u.id) AS total_users
FROM openstore_catalog.shops_csv s
LEFT JOIN openstore_catalog.products p ON p.shopid = s.id
LEFT JOIN openstore_catalog.users u ON u.shop_id = s.id
GROUP BY s.id, s.name, s.phone_number;
```

**Vista 2 — Usuarios con tienda y membresía:**
```sql
CREATE OR REPLACE VIEW openstore_catalog.v_usuarios_tienda AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    u.role,
    s.name AS shop_name,
    m.role AS membership_role
FROM openstore_catalog.users u
LEFT JOIN openstore_catalog.shops_csv s ON u.shop_id = s.id
LEFT JOIN openstore_catalog.memberships_csv m
    ON m.user_id = u.id AND m.shop_id = s.id;
```

---

## Problemas encontrados y soluciones

### 1. `No module named 'bcrypt'`
El seed requiere bcrypt. Instalar antes de correr:
```bash
pip3 install -r requirements.txt
```

### 2. `Table 'shopdb.Shop' doesn't exist`
Las tablas de MySQL no existen si shop-service nunca corrió. `seed.py` las crea automáticamente con `CREATE TABLE IF NOT EXISTS` antes de insertar.

### 3. `Authentication failed` en MongoDB
MongoDB Docker requiere `?authSource=admin` en el URI:
```
mongodb://admin:admin123@172.31.11.149:27017/productdb?authSource=admin
```

### 4. `InvalidAccessKeyId` al subir a S3
Las credenciales de AWS Academy son temporales. Actualizar `.env` con las 3 variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`) al inicio de cada sesión de Academy.

### 5. `AccessDenied` en bucket S3
El bucket `openstore-products-<account-id>` tiene política restrictiva. Crear un bucket nuevo para la ingesta:
```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
aws s3 mb s3://openstore-ingest-637423414138 --region us-east-1
```

### 6. `cryptography package is required` en ingest-shops
MySQL 8 usa `caching_sha2_password` que requiere el paquete `cryptography`. Agregado a `ingest-shops/requirements.txt`. Correr con `--build` para reconstruir la imagen.

### 7. `HIVE_CURSOR_ERROR: Failed to read file` en products
Athena no puede leer arrays JSON `[{...}]`. El archivo debe estar en formato **JSON Lines** (un objeto por línea). `ingest-products/main.py` fue corregido para escribir JSONL.

### 8. Tabla `shops_csv` vacía en Athena
El crawler corrió cuando el archivo aún estaba vacío o malformado. Solución: eliminar la tabla en Glue → Tables, volver a correr el crawler después de que el archivo esté correcto en S3.

### 9. IPs cambian al reiniciar Academy
Las IPs públicas cambian, pero las **IPs privadas dentro de la VPC no cambian**. Siempre usar IPs privadas (`172.31.11.149`) en el `.env`.

### 10. `docker compose` no disponible en MV-Ingesta
Amazon Linux 2023 no tiene el plugin `compose`. Instalar el binario de Docker Compose v2:
```bash
sudo curl -SL "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 11. `docker-compose` Python falla con `ssl_version` o `http+docker` en MV-Ingesta
La versión de `docker-compose` instalada vía pip tiene incompatibilidades con versiones nuevas de `requests` y `urllib3`. La solución es instalar el binario oficial de Docker Compose v2 con un nombre distinto para evitar conflicto:
```bash
sudo curl -L https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose2
sudo chmod +x /usr/local/bin/docker-compose2
```
Usar siempre `docker-compose2` en lugar de `docker-compose` en MV-Ingesta.

### 12. Tablas `shops_csv` y `memberships_csv` devuelven 0 filas en Athena
El crawler de Glue apunta a una carpeta con múltiples archivos CSV y genera tablas cuya `Location` apunta al archivo específico en vez de a una carpeta. Athena no puede leer datos cuando la `Location` de la tabla es un archivo y no un prefijo S3.

**Solución**: mover cada archivo a su propia subcarpeta y volver a correr el crawler:
```bash
aws s3 cp s3://openstore-ingest-637423414138/shops/shops.csv \
  s3://openstore-ingest-637423414138/shops_data/shops.csv

aws s3 cp s3://openstore-ingest-637423414138/shops/memberships.csv \
  s3://openstore-ingest-637423414138/memberships_data/memberships.csv
```
Luego en Glue: eliminar las tablas `shops_csv` y `memberships_csv`, apuntar el crawler a `s3://openstore-ingest-637423414138/` y volver a correrlo. Las nuevas tablas se llamarán `shops_data` y `memberships_data`.

> **Importante**: actualizar todas las queries de Athena para usar `shops_data` y `memberships_data` en lugar de `shops_csv` y `memberships_csv`.

### 13. `Unable to locate credentials` al usar AWS CLI en MV-Ingesta
El archivo `.env` solo lo leen los contenedores Docker. La terminal necesita las credenciales exportadas como variables de entorno de la sesión:
```bash
export AWS_ACCESS_KEY_ID=ASIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
```
Estas variables se pierden al cerrar la terminal — deben exportarse en cada nueva sesión.

---

## Checklist de ejecución completa

```
[ ] App-1: docker compose up -d (database/)
[ ] App-1: docker compose up -d (backend/) — para crear tablas vía JPA
[ ] MV-Ingesta: actualizar .env con credenciales AWS de la sesión
[ ] MV-Ingesta: pip3 install -r requirements.txt
[ ] MV-Ingesta: python3 seed.py
[ ] MV-Ingesta: /usr/local/bin/docker-compose2 up --build
[ ] AWS Glue: crear DB openstore_catalog
[ ] AWS Glue: crear crawlers (users, shops, products)
[ ] AWS Glue: correr los 3 crawlers → estado Ready
[ ] Athena: configurar output bucket
[ ] Athena: correr Query 1 (products JOIN shops)
[ ] Athena: correr Query 2 (users LEFT JOIN shops)
[ ] Athena: correr Query 3 (memberships JOIN shops)
[ ] Athena: correr Query 4 (resumen por tienda)
[ ] Athena: crear Vista 1 (v_tienda_resumen)
[ ] Athena: crear Vista 2 (v_usuarios_tienda)
```
