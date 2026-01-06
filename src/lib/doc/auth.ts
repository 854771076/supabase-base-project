export const authPaths = {
  '/api/v1/auth/callback': {
    get: {
      summary: 'Authentication callback',
      description: 'Handles authentication callback from Supabase Auth.',
      tags: ['Auth'],
      parameters: [
        {
          name: 'code',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'Authorization code',
        },
        {
          name: 'next',
          in: 'query',
          schema: {
            type: 'string',
          },
          description: 'Redirect URL after successful authentication',
        },
      ],
      responses: {
        302: {
          description: 'Redirect to the specified URL after successful authentication',
        },
        500: {
          description: 'Internal server error',
        },
      },
    },
  },
};
