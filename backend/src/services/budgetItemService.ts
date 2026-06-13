import { randomUUID } from 'crypto';
import logger from '../utils/logger';
import { BudgetItem, IBudgetItem } from '../models/BudgetItem';
import { AppError } from '../middleware/errorHandler';
import { BudgetItem as BudgetItemType } from '../types';

export class BudgetItemService {
  /**
   * Get all budget items for a user
   */
  async getBudgetItems(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      active?: boolean;
      cycleType?: string;
    } = {}
  ): Promise<{ items: BudgetItemType[]; total: number }> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const sortBy = options.sortBy || 'startDate';
      const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

      const filter: Record<string, unknown> = { userId };

      if (options.active !== undefined) {
        filter.isActive = options.active;
      }

      if (options.cycleType) {
        filter.cycleType = options.cycleType;
      }

      const items = await BudgetItem.find(filter)
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(offset);

      const total = await BudgetItem.countDocuments(filter);

      return { items: items.map(this.mapToType), total };
    } catch (error) {
      logger.error('Failed to get budget items', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to get budget items');
    }
  }

  /**
   * Get budget item by ID
   */
  async getBudgetItem(userId: string, itemId: string): Promise<BudgetItemType> {
    try {
      const item = await BudgetItem.findOne({ _id: itemId, userId });

      if (!item) {
        throw new AppError('NOT_FOUND', 404, 'Budget item not found');
      }

      return this.mapToType(item);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get budget item', { error, userId, itemId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to get budget item');
    }
  }

  /**
   * Create budget item
   */
  async createBudgetItem(userId: string, data: Partial<BudgetItemType>): Promise<BudgetItemType> {
    try {
      const item = new BudgetItem({
        _id: randomUUID(),
        userId,
        name: data.name,
        description: data.description,
        value: data.value,
        cycleType: data.cycleType,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        isPaid: false,
        _syncState: 'pending',
        _serverUpdatedAt: new Date(),
      });

      await item.save();

      logger.info('Budget item created', { userId, itemId: item._id });

      return this.mapToType(item);
    } catch (error) {
      logger.error('Failed to create budget item', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to create budget item');
    }
  }

  /**
   * Update budget item
   */
  async updateBudgetItem(
    userId: string,
    itemId: string,
    data: Partial<BudgetItemType>
  ): Promise<BudgetItemType> {
    try {
      const item = await BudgetItem.findOne({ _id: itemId, userId });

      if (!item) {
        throw new AppError('NOT_FOUND', 404, 'Budget item not found');
      }

      // Update fields
      if (data.name !== undefined) item.name = data.name;
      if (data.description !== undefined) item.description = data.description;
      if (data.value !== undefined) item.value = data.value;
      if (data.cycleType !== undefined) item.cycleType = data.cycleType;
      if (data.startDate !== undefined) item.startDate = data.startDate;
      if (data.endDate !== undefined) item.endDate = data.endDate;

      item._syncState = 'pending';
      item._serverUpdatedAt = new Date();

      await item.save();

      logger.info('Budget item updated', { userId, itemId });

      return this.mapToType(item);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to update budget item', { error, userId, itemId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to update budget item');
    }
  }

  /**
   * Soft delete budget item (mark as inactive)
   */
  async deleteBudgetItem(userId: string, itemId: string, endDate: Date): Promise<void> {
    try {
      const item = await BudgetItem.findOne({ _id: itemId, userId });

      if (!item) {
        throw new AppError('NOT_FOUND', 404, 'Budget item not found');
      }

      item.isActive = false;
      item.endDate = endDate;
      item._syncState = 'pending';
      item._serverUpdatedAt = new Date();

      await item.save();

      logger.info('Budget item deleted', { userId, itemId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to delete budget item', { error, userId, itemId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to delete budget item');
    }
  }

  /**
   * Mark budget item as paid
   */
  async markAsPaid(userId: string, itemId: string, paidDate?: Date): Promise<BudgetItemType> {
    try {
      const item = await BudgetItem.findOne({ _id: itemId, userId });

      if (!item) {
        throw new AppError('NOT_FOUND', 404, 'Budget item not found');
      }

      item.isPaid = true;
      item.lastPaidDate = paidDate || new Date();
      item._syncState = 'pending';
      item._serverUpdatedAt = new Date();

      await item.save();

      logger.info('Budget item marked as paid', { userId, itemId });

      return this.mapToType(item);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to mark budget item as paid', { error, userId, itemId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to mark budget item as paid');
    }
  }

  /**
   * Get budget items for a period
   */
  async getBudgetItemsForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    items: BudgetItemType[];
    totalExpected: number;
    totalPaid: number;
    remaining: number;
  }> {
    try {
      const items = await BudgetItem.find({
        userId,
        isActive: true,
        startDate: { $lte: endDate },
        $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
      });

      const mappedItems = items.map((item) => this.mapToType(item));

      const totalExpected = items.reduce((sum, item) => sum + item.value, 0);
      const totalPaid = items.filter((item) => item.isPaid).reduce((sum, item) => sum + item.value, 0);
      const remaining = totalExpected - totalPaid;

      return {
        items: mappedItems,
        totalExpected,
        totalPaid,
        remaining,
      };
    } catch (error) {
      logger.error('Failed to get budget items for period', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to get budget items for period');
    }
  }

  /**
   * Map database model to API type
   */
  private mapToType(item: IBudgetItem): BudgetItemType {
    return {
      id: item._id,
      name: item.name,
      description: item.description,
      value: item.value,
      cycleType: item.cycleType,
      startDate: item.startDate,
      endDate: item.endDate,
      isActive: item.isActive,
      isPaid: item.isPaid,
      lastPaidDate: item.lastPaidDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      _syncState: item._syncState,
      _clientUpdatedAt: item._clientUpdatedAt,
      _serverUpdatedAt: item._serverUpdatedAt,
      _clientId: item._clientId,
    };
  }
}

export const budgetItemService = new BudgetItemService();
