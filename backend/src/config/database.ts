import mongoose from 'mongoose';
import logger from '../utils/logger';
import { config } from './environment';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    logger.info(`Connecting to MongoDB: ${config.mongodbUri?.substring(0, 30)}...`);

    await mongoose.connect(config.mongodbUri || '', {
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Failed to disconnect database', { error });
    throw error;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

// Connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose connection lost');
  isConnected = false;
});

mongoose.connection.on('error', (error) => {
  logger.error('Mongoose connection error', { error });
});
