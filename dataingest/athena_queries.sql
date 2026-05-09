-- ============================================================
-- OpenStore — AWS Athena Queries
-- Base de datos: openstore_catalog
-- Tablas: users, shops_csv, memberships_csv, products
-- ============================================================

-- ============================================================
-- QUERY 1: Productos con nombre de tienda (JOIN products + shops)
-- ============================================================
SELECT
    p.id            AS product_id,
    p.name          AS product_name,
    p.price,
    p.availability,
    s.name          AS shop_name
FROM openstore_catalog.products p
JOIN openstore_catalog.shops_csv s
    ON p.shopid = s.id
LIMIT 100;


-- ============================================================
-- QUERY 2: Usuarios con su tienda asignada
-- ============================================================
SELECT
    u.id            AS user_id,
    u.name          AS user_name,
    u.email,
    u.role,
    s.name          AS shop_name
FROM openstore_catalog.users u
LEFT JOIN openstore_catalog.shops_csv s
    ON u.shop_id = s.id
WHERE u.role = 'USER'
LIMIT 100;


-- ============================================================
-- QUERY 3: Miembros por tienda con su rol
-- ============================================================
SELECT
    s.name          AS shop_name,
    m.user_id,
    m.role          AS membership_role
FROM openstore_catalog.memberships_csv m
JOIN openstore_catalog.shops_csv s
    ON m.shop_id = s.id
ORDER BY s.name
LIMIT 100;


-- ============================================================
-- QUERY 4: Resumen de productos y usuarios por tienda
-- ============================================================
SELECT
    s.name                  AS shop_name,
    COUNT(DISTINCT p.id)    AS total_products,
    COUNT(DISTINCT u.id)    AS total_users
FROM openstore_catalog.shops_csv s
LEFT JOIN openstore_catalog.products p
    ON p.shopid = s.id
LEFT JOIN openstore_catalog.users u
    ON u.shop_id = s.id
GROUP BY s.name
ORDER BY total_products DESC
LIMIT 50;


-- ============================================================
-- VISTA 1: v_tienda_resumen
-- ============================================================
CREATE OR REPLACE VIEW openstore_catalog.v_tienda_resumen AS
SELECT
    s.id                    AS shop_id,
    s.name                  AS shop_name,
    s.phone_number,
    COUNT(DISTINCT p.id)    AS total_products,
    COUNT(DISTINCT u.id)    AS total_users
FROM openstore_catalog.shops_csv s
LEFT JOIN openstore_catalog.products p
    ON p.shopid = s.id
LEFT JOIN openstore_catalog.users u
    ON u.shop_id = s.id
GROUP BY s.id, s.name, s.phone_number;


-- ============================================================
-- VISTA 2: v_usuarios_tienda
-- ============================================================
CREATE OR REPLACE VIEW openstore_catalog.v_usuarios_tienda AS
SELECT
    u.id                    AS user_id,
    u.name                  AS user_name,
    u.email,
    u.role,
    s.name                  AS shop_name,
    m.role                  AS membership_role
FROM openstore_catalog.users u
LEFT JOIN openstore_catalog.shops_csv s
    ON u.shop_id = s.id
LEFT JOIN openstore_catalog.memberships_csv m
    ON m.user_id = u.id
    AND m.shop_id = s.id;
