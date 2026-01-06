export const paymentPaths = {
  '/api/v1/payments/create-order': {
    post: {
      summary: 'Create a new payment order',
      description: 'Creates a new payment order for subscription or credits purchase.',
      tags: ['Payment'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['subscription', 'credits'],
                  description: 'Order type',
                },
                productId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Product ID (plan ID for subscription, credit product ID for credits)',
                },
              },
              required: ['type', 'productId'],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    description: 'Success status',
                  },
                  order: {
                    $ref: '#/components/schemas/Order',
                  },
                  approvalUrl: {
                    type: 'string',
                    description: 'Payment approval URL',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request - Invalid parameters or free plan does not require payment',
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
        404: {
          description: 'Product not found',
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
  '/api/v1/payments/capture-order': {
    post: {
      summary: 'Capture a payment order',
      description: 'Captures a payment order after user approval.',
      tags: ['Payment'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                orderId: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Order ID',
                },
                providerOrderId: {
                  type: 'string',
                  description: 'Provider order ID',
                },
              },
              required: ['orderId', 'providerOrderId'],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Order captured successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    description: 'Success status',
                  },
                  order: {
                    $ref: '#/components/schemas/Order',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request - Order already completed',
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
        404: {
          description: 'Order not found',
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
  '/api/v1/payments/orders': {
    get: {
      summary: 'Get user orders list',
      description: 'Returns a list of orders for the authenticated user with pagination.',
      tags: ['Payment'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['subscription', 'credits'],
          },
          description: 'Filter orders by type',
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          description: 'Number of orders per page',
        },
        {
          name: 'offset',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0,
          },
          description: 'Offset for pagination',
        },
      ],
      responses: {
        200: {
          description: 'Orders list retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    description: 'Success status',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Order',
                    },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      limit: {
                        type: 'integer',
                        description: 'Number of orders per page',
                      },
                      offset: {
                        type: 'integer',
                        description: 'Offset for pagination',
                      },
                      count: {
                        type: 'integer',
                        description: 'Number of orders returned',
                      },
                    },
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
  '/api/v1/payments/orders/{id}': {
    get: {
      summary: 'Get order details',
      description: 'Returns the details of a specific order for the authenticated user.',
      tags: ['Payment'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
          description: 'Order ID',
        },
      ],
      responses: {
        200: {
          description: 'Order details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    description: 'Success status',
                  },
                  data: {
                    $ref: '#/components/schemas/Order',
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
        404: {
          description: 'Order not found',
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
