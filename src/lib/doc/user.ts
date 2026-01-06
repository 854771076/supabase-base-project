export const userPaths = {
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
                $ref: '#/components/schemas/ErrorResponse'
              },
            },
          },
        },
      },
    },
  },
};
