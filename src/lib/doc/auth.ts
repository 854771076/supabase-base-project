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
  '/api/v1/auth/web3/nonce': {
    get: {
      summary: 'Generate a nonce for SIWE authentication',
      description: 'Returns a random nonce for Sign-In with Ethereum (SIWE) signature',
      tags: ['Auth'],
      responses: {
        200: {
          description: 'Successfully generated nonce',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nonce: {
                    type: 'string',
                    description: 'Random nonce string for SIWE',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/web3/verify': {
    post: {
      summary: 'Verify SIWE signature and create Supabase session',
      description: 'Verifies the SIWE signature and creates a Supabase user session',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message', 'signature'],
              properties: {
                message: {
                  type: 'string',
                  description: 'The SIWE message that was signed',
                },
                signature: {
                  type: 'string',
                  description: 'The signature of the SIWE message',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully verified and created session',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      wallet_address: { type: 'string' },
                    },
                  },
                  verification: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      type: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Missing required fields or invalid message',
        },
        401: {
          description: 'Invalid signature',
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },
};
