export const cronPaths = {
    '/api/v1/cron_job/sync-pending': {
        get: {
            summary: 'Sync pending TokenPay orders',
            description: 'Synchronizes pending TokenPay orders and handles timeouts. Secured by ADMIN_CRON_SECRET.',
            tags: ['Cron'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'Sync successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    processed: { type: 'integer' },
                                    results: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                orderId: { type: 'string', format: 'uuid' },
                                                status: { type: 'string' },
                                                message: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: {
                    description: 'Unauthorized - Invalid or missing ADMIN_CRON_SECRET',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                500: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
    },
};
