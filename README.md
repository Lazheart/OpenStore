# OpenStore

OpenStore es una plataforma de e-commerce open source, autohosteable y basada en microservicios.

Permite gestionar multiples tiendas, productos y usuarios con una arquitectura desacoplada lista para nube.

## Que es OpenStore

OpenStore busca ser una alternativa abierta para construir tiendas online, con estos objetivos:

- Separacion por dominios (usuarios, tiendas, productos).
- Escalado por servicio.
- Despliegue en AWS con infraestructura declarativa.
- Frontend personalizable para cada marca.

## Arquitectura

El proyecto esta organizado por servicios:

- frontend: interfaz React.
- backend/user-service: autenticacion y gestion de usuarios (Spring Boot).
- backend/shop-service: gestion de tiendas y membresias (Node.js + Express + Prisma).
- backend/product-service: catalogo de productos e imagenes (FastAPI + S3).

Bases de datos utilizadas segun el dominio:

- PostgreSQL
- MySQL
- MongoDB

## Funcionalidades principales

- Gestion de usuarios con roles ADMIN, OWNER y CLIENT.
- Creacion y administracion de tiendas.
- Catalogo de productos por tienda.
- Soporte para imagenes de productos en S3.
- Personalizacion visual de la tienda (temas).
- Flujo de cierre de venta con pasarela de pago o contacto por WhatsApp.

## Stack tecnologico

- Frontend: React + TypeScript + Vite.
- User service: Java + Spring Boot.
- Shop service: TypeScript + Express + Prisma.
- Product service: Python + FastAPI.
- Infraestructura: AWS CloudFormation.

## Despliegue

El repositorio incluye un template de infraestructura en [cloud-formation.yml](cloud-formation.yml), con:

- Balanceador de carga (ALB).
- Servidores de aplicacion.
- Servidor de base de datos.
- Bucket S3.

Script de inicializacion:

- [setup.sh](setup.sh) (pensado para entornos Linux).

## Documentacion

La documentacion tecnica de APIs, comunicacion entre servicios y modelo ER se encuentra en:

- [docs/index.html](docs/index.html)

## Estado del repositorio

El proyecto esta en evolucion activa y algunos componentes pueden estar en proceso de ajuste.


