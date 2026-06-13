import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Budgetting API',
      version: '1.0.0',
      description: 'API for budgetting application with offline-first sync capability',
      contact: {
        name: 'Budgetting Team',
      },
    },
    servers: [
      {
        url: config.apiUrl,
        description: config.isDevelopment ? 'Development server' : 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                statusCode: { type: 'number' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        BudgetItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            value: { type: 'number' },
            cycleType: { type: 'string', enum: ['monthly', 'weekly', 'bi-weekly', 'daily', 'one-time'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            isPaid: { type: 'boolean' },
            lastPaidDate: { type: 'string', format: 'date-time' },
            _syncState: { type: 'string', enum: ['pending', 'synced', 'failed', 'conflicted'] },
            _serverUpdatedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Settings: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            payCycle: { type: 'number' },
            estimatedPay: { type: 'number' },
            expectedPayDate: { type: 'number' },
            darkModeEnabled: { type: 'boolean' },
            hideValues: { type: 'boolean' },
            currency: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SyncStatus: {
          type: 'object',
          properties: {
            pendingCount: { type: 'number' },
            failedCount: { type: 'number' },
            conflictedCount: { type: 'number' },
            lastSyncTime: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            token: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
