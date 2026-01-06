export const subscriptionPaths = {
  '/api/v1/subscription/subscribe': {
    post: {
      summary: 'Update user subscription',
      description: 'Updates the user subscription to a different plan.',
      tags: ['Subscription'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                planId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Plan ID',
                },
              },
              required: ['planId'],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Subscription updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    description: 'Success status',
                  },
                  subscription: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Subscription ID',
                      },
                      user_id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'User ID',
                      },
                      plan_id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Plan ID',
                      },
                      status: {
                        type: 'string',
                        description: 'Subscription status',
                      },
                      current_period_end: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Current period end timestamp',
                      },
                      plan: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Plan ID',
                          },
                          name: {
                            type: 'string',
                            description: 'Plan name',
                          },
                          price_cents: {
                            type: 'integer',
                            description: 'Plan price in cents',
                          },
                          features: {
                            type: 'object',
                            description: 'Plan features',
                          },
                          quotas: {
                            type: 'object',
                            description: 'Plan quotas',
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
        400: {
          description: 'Bad request - Invalid plan ID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
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
