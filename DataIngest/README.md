# OpenStore — Seeder

Script de ingesta de datos para poblar el entorno de OpenStore con información de prueba realista.

## ¿Qué crea?

| Recurso | Cantidad |
|---------|----------|
| Tiendas | 10 |
| Dueños (owners) | 10 (uno por tienda) |
| Productos por tienda | 200 |
| Usuarios normales por tienda | 100 |
| **Total de registros** | **~3.010** |

---

## Requisitos

- Python 3.11 o superior
- El **store-service** de OpenStore debe estar corriendo y accesible

---

## Instalación

```bash
cd backend/seeder
pip install -r requirements.txt
```

---

## Configuración

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

Abre `.env` y reemplaza `TU_IP` con la dirección del servidor:

```env
STORE_SERVICE_URL=http://TU_IP:8004
```

### Variables disponibles

| Variable | Default | Descripción |
|----------|---------|-------------|
| `STORE_SERVICE_URL` | **Requerido** | URL pública del store-service |
| `NUM_SHOPS` | `10` | Número de tiendas a crear |
| `PRODUCTS_PER_SHOP` | `200` | Productos por tienda |
| `USERS_PER_SHOP` | `100` | Usuarios normales por tienda |
| `CONCURRENCY` | `20` | Requests HTTP simultáneos máximos |

> `STORE_SERVICE_URL` es obligatorio. El script no arranca sin él.

---

## Uso

### Prueba rápida (recomendado antes del seed completo)

Corre con números pequeños para verificar que todo funciona:

```bash
NUM_SHOPS=1 PRODUCTS_PER_SHOP=5 USERS_PER_SHOP=5 python seed.py
```

### Seed completo

```bash
python seed.py
```

---

## Salida esperada

```
[1/10] Registrando owner: owner1_a3f2bc1d@seed.dev ...OK
[1/10] Login owner ...OK
[1/10] Creando tienda: Distribuciones Pérez S.A. #1 ...OK (shopId: abc-123-...)
[1/10] Creando 200 productos y 100 usuarios en paralelo...
[1/10] ✓ 200 productos | 100 usuarios
[2/10] Registrando owner: owner2_e7d9fa2b@seed.dev ...OK
...

===================================
Resumen final:
  Tiendas creadas:   10 / 10
  Productos creados: 2000 / 2000
  Usuarios creados:  1000 / 1000
  Fallos totales:    0
===================================
```

---

## Datos generados

Todos los datos son generados con **Faker en español**.

| Dato | Formato | Ejemplo |
|------|---------|---------|
| Email de owner | `owner{N}_{id}@seed.dev` | `owner1_a3f2bc1d@seed.dev` |
| Email de usuario | `user{N}_{id}@seed.dev` | `user42_f1e2d3c4@seed.dev` |
| Password | `Seed1234!{N}` | `Seed1234!1` |
| Nombre de tienda | Empresa faker + número | `Soluciones Tech #3` |
| Imagen de producto | picsum.photos | `https://picsum.photos/seed/1005/400/400` |
| Precio | Entre $1.00 y $999.99 | `47.35` |

> Los passwords cumplen los requisitos del sistema: mayúscula, minúscula y número.

---

## Solución de problemas

### El script no arranca
```
ERROR: STORE_SERVICE_URL no está configurada.
```
**Solución:** Verifica que tu archivo `.env` existe y tiene `STORE_SERVICE_URL` definido.

---

### No hay conexión al servidor
```
[1/10] Registrando owner: ... FALLO (ConnectError)
```
**Solución:** Verifica que el store-service esté corriendo:
```bash
curl http://TU_IP:8004/health
```

---

### Fallos en productos o usuarios

El script **no se detiene** si un producto o usuario individual falla — continúa y lo reporta al final. Si hay muchos fallos, revisa que el servidor tenga recursos disponibles o baja el valor de `CONCURRENCY` en `.env`.

---

### Datos duplicados (si corres el script dos veces)

Los emails incluyen un fragmento de UUID (`owner1_a3f2bc1d`) para reducir colisiones, pero si corres el script varias veces podrían aparecer errores `Email already in use`. En ese caso limpia la base de datos antes de volver a correr.

---

## Tests

```bash
python -m pytest tests/ -v
```

26 tests cubren: carga de configuración, generadores de datos, clientes HTTP y el orquestador completo.
