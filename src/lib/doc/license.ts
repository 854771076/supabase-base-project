export const licensePaths = {
    '/api/v1/licenses/verify': {
        get: {
            summary: 'Verify a license key',
            description: 'Checks if a license key is valid, active, and not expired.',
            tags: ['License'],
            parameters: [
                {
                    name: 'key',
                    in: 'query',
                    required: true,
                    description: 'The license key to verify (Format: XXXX-XXXX-XXXX-XXXX)',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'License verification result',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', description: 'API call success status' },
                                    valid: { type: 'boolean', description: 'Whether the license is currently valid' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            key: { type: 'string', description: 'The license key verified' },
                                            product_name: { type: 'string', description: 'Name of the associated product' },
                                            expires_at: { type: 'string', format: 'date-time', nullable: true, description: 'Expiration timestamp' },
                                            status: { type: 'string', enum: ['active', 'expired', 'revoked'], description: 'Current status' },
                                            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
                                        },
                                    },
                                    status: { type: 'string', description: 'Detailed status if not valid' },
                                    error: { type: 'string', description: 'Error message if invalid or error occurred' },
                                },
                            },
                        },
                    },
                },
                400: {
                    description: 'Bad Request - Missing license key',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse',
                            },
                        },
                    },
                },
                404: {
                    description: 'Not Found - Invalid license key',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    valid: { type: 'boolean', example: false },
                                    error: { type: 'string', example: 'Invalid license key' },
                                },
                            },
                        },
                    },
                },
                500: {
                    description: 'Internal Server Error',
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
