# Store Service

Servicio encargado de redirigir a los microservicios correspondientes.
Funciona como API de paso para que frontend y otros servicios hablen con un solo entrypoint.

## Variables de entorno

- USER_SERVICE_URL (default: http://user-service:8080)
- USER_AUTH_BASE_PATH (default: /api/auth)
- SHOP_SERVICE_URL (default: http://shop-service:3000)
- PRODUCT_SERVICE_URL (default: http://product-service:8000)
- STORE_SERVICE_TIMEOUT (default: 15)
- EVENTS_INTERNAL_TOKEN (obligatorio para eventos internos)

## Endpoints

GET /health

Retorna estado del servicio.

POST /auth/login

Body:

{
    identifier,
    password,
    shopId
}

Si el request no incluye shopId, se manda a /auth/login.
Si incluye shopId, se manda a /auth/{shopId}/login.

POST /auth/register

{
    email,
    phoneNumber,
    name,
    shopId
}

Si el request no incluye shopId, se manda a /auth/register.
Si incluye shopId, se manda a /auth/{shopId}/register.

POST /openshop/shop

Body:

{
    shopName,
    phoneNumber
}

Reenvia a shop-service, que valida rol OWNER, plan (FREE/PRO/MAX),
unicidad de nombre y ownership.

GET /shop/name/{shopName}

Devuelve:

{
    shopName,
    shopId,
    phoneNumber
}

PATCH /shop/id/{shopId}

Body opcional (al menos uno):

{
    shopName,
    phoneNumber
}

DELETE /shop/id/{shopId}

Solo permitido para el owner de la tienda.
Publica un evento asincrono para:
1) eliminar productos e imagenes asociadas en product-service,
2) eliminar la tienda en shop-service.

DELETE /shops/{shopId}/products/{productId}

Publica un evento asincrono para eliminar el producto.
product-service elimina tambien la imagen en S3.

GET /shop/id/{shopId}/owner

Devuelve:

{
    shopId,
    ownerId
}

Este endpoint facilita validar existencia de tienda segun ownerId.

POST /events/users/{userId}/deleted

Headers:

{
    x-internal-token
}

Body:

{
    role
}

Si role = OWNER (o sin role), publica un evento asincrono que elimina
todas las tiendas del owner y todos los productos/imagenes asociados.

## Notas de asincronia

El modulo events.py centraliza los eventos y procesa en segundo plano:

- SHOP_DELETION_REQUESTED
- PRODUCT_DELETION_REQUESTED
- OWNER_DELETED

