export const demoPaths = {
  '/api/v1/demo/request': {
    post: {
      summary: 'Demo API request',
      description: 'Demo API request to test feature permissions and quota checking.',
      tags: ['Demo'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'API request successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    description: 'Success status',
                  },
                  message: {
                    type: 'string',
                    description: 'Success message',
                  },
                  currentUsage: {
                    type: 'integer',
                    description: 'Current usage count',
                  },
                  limit: {
                    type: 'integer',
                    description: 'Usage limit',
                  },
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
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Plan does not have API access',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        429: {
          description: 'Too many requests - Quota exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    description: 'Error message',
                  },
                  currentUsage: {
                    type: 'integer',
                    description: 'Current usage count',
                  },
                  limit: {
                    type: 'integer',
                    description: 'Usage limit',
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
};
