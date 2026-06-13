import { randomUUID } from 'crypto';
import logger from '../utils/logger';
import { User } from '../models/User';
import { Setting } from '../models/Setting';
import { hashPassphrase, verifyPassphrase } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  /**
   * Create a new user with passphrase
   */
  async createUser(): Promise<string> {
    try {
      const userId = randomUUID();

      const user = new User({
        _id: userId,
        passphraseHash: 'passphraseTestHash', // Will be set during first login
      });

      await user.save();

      // Create default settings
      const setting = new Setting({
        userId,
        payCycle: 'monthly',
        estimatedPay: 0,
        expectedPayDate: 1,
      });

      await setting.save();

      logger.info('User created', { userId });

      return userId;
    } catch (error) {
        console.log(error)
      logger.error('Failed to create user', { error });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to create user');
    }
  }

  /**
   * Set or update user passphrase
   */
  async setPassphrase(userId: string, passphrase: string): Promise<void> {
    try {
      const hash = await hashPassphrase(passphrase);

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('NOT_FOUND', 404, 'User not found');
      }

      user.passphraseHash = hash;
      await user.save();

      logger.info('Passphrase updated', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to set passphrase', { error });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to set passphrase');
    }
  }

  /**
   * Authenticate user with passphrase
   */
  async authenticate(userId: string, passphrase: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.warn('Authentication failed: user not found', { userId });
        return false;
      }

      if (!user.passphraseHash) {
        logger.warn('Authentication failed: no passphrase set', { userId });
        return false;
      }

      const isValid = await verifyPassphrase(passphrase, user.passphraseHash);

      if (!isValid) {
        logger.warn('Authentication failed: invalid passphrase', { userId });
      } else {
        logger.info('User authenticated', { userId });
      }

      return isValid;
    } catch (error) {
      logger.error('Authentication error', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Authentication error');
    }
  }

  /**
   * Get or create user (for onboarding)
   */
  async getOrCreateUser(userId?: string): Promise<string> {
    try {
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          return userId;
        }
      }

      // Create new user
      return await this.createUser();
    } catch (error) {
      logger.error('Failed to get or create user', { error });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to get or create user');
    }
  }

  /**
   * Verify user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      return !!user;
    } catch (error) {
      logger.error('Failed to check user existence', { error });
      return false;
    }
  }
}

export const authService = new AuthService();
