import { createSwaggerSpec } from 'next-swagger-doc';
import { getURL } from '@/utils/url';
import { userPaths, paymentPaths, subscriptionPaths, demoPaths, authPaths, cronPaths } from './doc';

export const getApiDocs = async () => {
  // 合并所有API路径
  const paths = {
    ...userPaths,
    ...paymentPaths,
    ...subscriptionPaths,
    ...demoPaths,
    ...authPaths,
    ...cronPaths,
  };

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
          url: '/',
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
        schemas: {
          ErrorResponse: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error message',
              },
              success: {
                type: 'boolean',
                description: 'Success status',
              },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Order ID',
              },
              user_id: {
                type: 'string',
                format: 'uuid',
                description: 'User ID',
              },
              type: {
                type: 'string',
                enum: ['subscription', 'credits'],
                description: 'Order type',
              },
              provider: {
                type: 'string',
                description: 'Payment provider',
              },
              provider_order_id: {
                type: 'string',
                description: 'Provider order ID',
              },
              status: {
                type: 'string',
                enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
                description: 'Order status',
              },
              amount_cents: {
                type: 'integer',
                description: 'Order amount in cents',
              },
              currency: {
                type: 'string',
                description: 'Currency code',
              },
              product_id: {
                type: 'string',
                format: 'uuid',
                description: 'Product ID',
              },
              product_type: {
                type: 'string',
                description: 'Product type',
              },
              product_name: {
                type: 'string',
                description: 'Product name',
              },
              metadata: {
                type: 'object',
                description: 'Order metadata',
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Order creation timestamp',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                description: 'Order update timestamp',
              },
              completed_at: {
                type: 'string',
                format: 'date-time',
                description: 'Order completion timestamp',
              },
            },
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
      paths,
    },
  });
  return spec;
};
