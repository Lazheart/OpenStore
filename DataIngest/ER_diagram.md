# Diagrama Entidad / Relación — OpenStore Data Catalog

Base de datos Glue: `openstore_catalog`

## Tablas

### users (PostgreSQL → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | PK |
| name | string | Nombre completo |
| email | string | Email único |
| phone_number | string | Teléfono |
| role | string | OWNER / USER / ADMIN / CLIENT |
| subscription | string | FREE / PRO / MAX |
| shop_id | string (UUID) | FK → shops.id |
| enabled | boolean | Cuenta activa |
| email_verified | boolean | Email verificado |
| token_version | int | Versión del JWT |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

### shops (MySQL → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | PK |
| name | string | Nombre único de la tienda |
| owner_id | string (UUID) | FK → users.id |
| phone_number | string | Teléfono de contacto |

### memberships (MySQL → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | PK |
| user_id | string (UUID) | FK → users.id |
| role | string | Rol dentro de la tienda |
| shop_id | string (UUID) | FK → shops.id |

### products (MongoDB → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (ObjectId) | PK |
| name | string | Nombre del producto |
| price | double | Precio |
| description | string | Descripción |
| imageUrl | string | URL de imagen en S3 |
| availability | string | AVAILABLE / OUT_OF_STOCK |
| shopId | string (UUID) | FK → shops.id |

## Relaciones

```
users ──────────────────────────────────── shops
│  id ◄──────── owner_id                    │ id
│  id ◄──── user_id ──── memberships        │
│  shop_id ──────────────────────────────► id
                                            │ id
                          products.shopId ──┘
```

| Relación | Desde | Hacia | Cardinalidad |
|----------|-------|-------|--------------|
| Dueño de tienda | shops.owner_id | users.id | N:1 |
| Usuario de tienda | users.shop_id | shops.id | N:1 |
| Membresía usuario | memberships.user_id | users.id | N:1 |
| Membresía tienda | memberships.shop_id | shops.id | N:1 |
| Producto de tienda | products.shopId | shops.id | N:1 |
