import { createSwaggerSpec } from 'next-swagger-doc';
import { getURL } from '@/utils/url';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'backend API documentation',
      },
      servers: [
        {
          url: getURL(),
          description: 'Current environment server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
      paths: {
        '/api/v1/user': {
          get: {
            summary: 'Get current authenticated user profile',
            description: 'Returns the basic profile information of the currently logged-in user.',
            tags: ['User'],
            security: [{ BearerAuth: [] }],
            responses: {
              200: {
                description: 'User profile data',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid', description: 'User ID' },
                        email: { type: 'string', format: 'email', description: 'User email' },
                        user_metadata: { type: 'object', description: 'User metadata' },
                        last_sign_in_at: { type: 'string', format: 'date-time', description: 'Last sign-in timestamp' },
                      },
                    },
                  },
                },
              },
              401: {
                description: 'Unauthorized - User not logged in',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string', example: 'Unauthorized' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  return spec;
};
