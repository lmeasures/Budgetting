import logger from '../utils/logger';
import { Setting, ISetting } from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { UserSettings } from '../types';

export class SettingsService {
  /**
   * Get user settings
   */
  async getSettings(userId: string): Promise<UserSettings> {
    try {
      let setting = await Setting.findOne({ userId });

      if (!setting) {
        // Create default settings if not exist
        setting = new Setting({
          userId,
          payCycle: 'monthly',
          estimatedPay: 0,
          expectedPayDate: 1,
        });
        await setting.save();
      }

      return this.mapToType(setting);
    } catch (error) {
      logger.error('Failed to get settings', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to get settings');
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    try {
      let setting = await Setting.findOne({ userId });

      if (!setting) {
        setting = new Setting({ userId });
      }

      // Update fields
      if (data.payCycle !== undefined) setting.payCycle = data.payCycle;
      if (data.estimatedPay !== undefined) setting.estimatedPay = data.estimatedPay;
      if (data.expectedPayDate !== undefined) setting.expectedPayDate = data.expectedPayDate;
      if (data.darkModeEnabled !== undefined) setting.darkModeEnabled = data.darkModeEnabled;
      if (data.hideValues !== undefined) setting.hideValues = data.hideValues;
      if (data.currency !== undefined) setting.currency = data.currency;

      setting._syncState = 'pending';
      setting._serverUpdatedAt = new Date();

      await setting.save();

      logger.info('Settings updated', { userId });

      return this.mapToType(setting);
    } catch (error) {
      logger.error('Failed to update settings', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to update settings');
    }
  }

  /**
   * Map database model to API type
   */
  private mapToType(setting: ISetting): UserSettings {
    return {
      payCycle: setting.payCycle,
      estimatedPay: setting.estimatedPay,
      expectedPayDate: setting.expectedPayDate,
      darkModeEnabled: setting.darkModeEnabled,
      hideValues: setting.hideValues,
      currency: setting.currency,
      updatedAt: setting.updatedAt,
      _syncState: setting._syncState,
    };
  }
}

export const settingsService = new SettingsService();
