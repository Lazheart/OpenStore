import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shop Service API',
      version: '1.0.0',
      description: 'API para la gestión de tiendas (Shops) y membresías en OpenStore',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          summary: 'Verifica el estado del microservicio',
          tags: ['Health'],
          responses: { '200': { description: 'Servicio OK' } }
        }
      },
      '/healthcheck': {
        get: {
          summary: 'Verifica el estado del microservicio',
          tags: ['Health'],
          responses: { '200': { description: 'Servicio OK' } }
        }
      },
      '/shops': {
        get: {
          summary: 'Lista todas las tiendas (Paginado)',
          tags: ['Shops'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Número de página' },
            { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Cantidad por página' }
          ],
          responses: { '200': { description: 'Lista obtenida con éxito' } }
        },
        post: {
          summary: 'Crea una nueva tienda',
          tags: ['Shops'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Mi Tienda Genial' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Tienda creada' } }
        }
      },
      '/shops/{id}': {
        get: {
          summary: 'Obtiene una tienda por ID',
          tags: ['Shops'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Tienda encontrada' } }
        },
        put: {
          summary: 'Actualiza una tienda',
          tags: ['Shops'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Tienda Actualizada' },
                    owner_id: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Tienda actualizada' } }
        },
        delete: {
          summary: 'Elimina una tienda',
          tags: ['Shops'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Tienda eliminada' } }
        }
      },
      '/shops/{id}/memberships': {
        post: {
          summary: 'Agrega un miembro (usuario) a una tienda',
          tags: ['Memberships'],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'ID de la tienda', schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', example: '2' },
                    role: { type: 'string', example: 'ADMIN' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Miembro agregado con éxito' } }
        }
      }
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

export const swaggerDocs = (app: Application, port: number) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(` Swagger Docs available at http://localhost:${port}/api-docs`);
};
