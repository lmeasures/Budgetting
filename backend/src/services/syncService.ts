import logger from '../utils/logger';
import { SyncLog } from '../models/SyncLog';
import { BudgetItem } from '../models/BudgetItem';
import { Setting } from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { SyncChange, SyncUploadResponse } from '../types';
import { budgetItemService } from './budgetItemService';
import { settingsService } from './settingsService';

export class SyncService {
  /**
   * Get sync status for user
   */
  async getSyncStatus(userId: string): Promise<{
    lastSyncAt?: Date;
    pendingChanges: number;
    failedSyncs: number;
    conflictedItems: number;
    syncEnabled: boolean;
    status: string;
  }> {
    try {
      // Get last successful sync
      const lastSync = await SyncLog.findOne({ userId, status: 'success' }).sort({
        createdAt: -1,
      });

      // Count pending changes
      const pendingBudgetItems = await BudgetItem.countDocuments({
        userId,
        _syncState: 'pending',
      });
      const pendingSetting = await Setting.findOne({ userId, _syncState: 'pending' });

      const pendingChanges = pendingBudgetItems + (pendingSetting ? 1 : 0);

      // Count failed and conflicted items
      const failedBudgetItems = await BudgetItem.countDocuments({
        userId,
        _syncState: 'failed',
      });
      const conflictedBudgetItems = await BudgetItem.countDocuments({
        userId,
        _syncState: 'conflicted',
      });

      const failedSyncs = failedBudgetItems;
      const conflictedItems = conflictedBudgetItems;

      return {
        lastSyncAt: lastSync?.createdAt,
        pendingChanges,
        failedSyncs,
        conflictedItems,
        syncEnabled: true,
        status: pendingChanges > 0 ? 'pending' : 'synced',
      };
    } catch (error) {
      logger.error('Failed to get sync status', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to get sync status');
    }
  }

  /**
   * Process sync upload (client -> server)
   */
  async uploadChanges(userId: string, changes: SyncChange[]): Promise<SyncUploadResponse> {
    const results: Array<{
      id: string;
      status: 'synced' | 'failed' | 'conflicted';
      serverUpdatedAt?: Date;
      error?: string;
    }> = [];

    let syncedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    try {
      for (const change of changes) {
        try {
          const result = await this.processChange(userId, change);
          results.push(result);

          if (result.status === 'synced') syncedCount++;
          else if (result.status === 'failed') failedCount++;
          else if (result.status === 'conflicted') conflictCount++;
        } catch (error) {
          logger.error('Failed to process change', { error, changeId: change.id });
          results.push({
            id: change.id,
            status: 'failed',
            error: (error as Error).message,
          });
          failedCount++;
        }
      }

      // Log sync attempt
      await this.logSync(userId, 'upload', {
        changesCount: changes.length,
        syncedCount,
        failedCount,
        conflictCount,
        status: failedCount === 0 ? 'success' : failedCount === changes.length ? 'failed' : 'partial',
      });

      return {
        synced: syncedCount,
        failed: failedCount,
        conflicts: conflictCount,
        results,
        serverTime: new Date(),
      };
    } catch (error) {
      logger.error('Upload changes error', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to upload changes');
    }
  }

  /**
   * Process individual sync change
   */
  private async processChange(
    userId: string,
    change: SyncChange
  ): Promise<{ id: string; status: 'synced' | 'failed' | 'conflicted'; serverUpdatedAt?: Date }> {
    try {
      if (change.type === 'budgetItem') {
        return await this.processBudgetItemChange(userId, change);
      } else if (change.type === 'setting') {
        return await this.processSettingChange(userId, change);
      } else {
        throw new Error('Unknown change type');
      }
    } catch (error) {
      logger.error('Failed to process change', { error, changeId: change.id });
      return {
        id: change.id,
        status: 'failed',
      };
    }
  }

  /**
   * Process budget item change
   */
  private async processBudgetItemChange(
    userId: string,
    change: SyncChange
  ): Promise<{ id: string; status: 'synced' | 'failed' | 'conflicted'; serverUpdatedAt?: Date }> {
    const { operation, id, data } = change;
    const clientUpdatedAt = change.clientUpdatedAt;

    if (operation === 'create') {
      const item = await budgetItemService.createBudgetItem(userId, {
        id,
        ...data,
        _clientUpdatedAt: clientUpdatedAt,
        _clientId: change.clientId,
      } as any);
      return { id, status: 'synced', serverUpdatedAt: item._serverUpdatedAt };
    } else if (operation === 'update') {
      // Check for conflicts
      const existing = await BudgetItem.findOne({ _id: id, userId });
      if (existing && clientUpdatedAt && existing._serverUpdatedAt) {
        const serverIsNewer = existing._serverUpdatedAt > clientUpdatedAt;
        if (serverIsNewer) {
          return { id, status: 'conflicted' };
        }
      }

      const item = await budgetItemService.updateBudgetItem(userId, id, {
        ...data,
        _clientUpdatedAt: clientUpdatedAt,
      } as any);
      return { id, status: 'synced', serverUpdatedAt: item._serverUpdatedAt };
    } else if (operation === 'delete') {
      await budgetItemService.deleteBudgetItem(userId, id, new Date());
      return { id, status: 'synced' };
    }

    throw new Error('Unknown operation');
  }

  /**
   * Process setting change
   */
  private async processSettingChange(
    userId: string,
    change: SyncChange
  ): Promise<{ id: string; status: 'synced' | 'failed' | 'conflicted'; serverUpdatedAt?: Date }> {
    const { operation, data, clientUpdatedAt: _clientUpdatedAt } = change;

    if (operation === 'update') {
      const setting = await settingsService.updateSettings(userId, data as any);
      return { id: change.id, status: 'synced', serverUpdatedAt: setting.updatedAt };
    }

    throw new Error('Unsupported setting operation');
  }

  /**
   * Get changes since timestamp (server -> client)
   */
  async downloadChanges(
    userId: string,
    since?: Date
  ): Promise<{ changes: SyncChange[]; serverTime: Date; hasMore: boolean }> {
    try {
      const query: Record<string, unknown> = { userId };

      if (since) {
        query._serverUpdatedAt = { $gt: since };
      }

      const budgetItems = await BudgetItem.find(query).limit(100);
      const setting = await Setting.findOne({ userId });

      const changes: SyncChange[] = [];

      // Add budget item changes
      for (const item of budgetItems) {
        changes.push({
          type: 'budgetItem',
          operation: item.isActive ? 'update' : 'delete',
          id: item._id,
          data: {
            name: item.name,
            description: item.description,
            value: item.value,
            cycleType: item.cycleType,
            startDate: item.startDate,
            endDate: item.endDate,
            isActive: item.isActive,
            isPaid: item.isPaid,
            lastPaidDate: item.lastPaidDate,
          },
          serverUpdatedAt: item._serverUpdatedAt,
        });
      }

      // Add setting changes
      if (setting && (!since || setting._serverUpdatedAt > since)) {
        changes.push({
          type: 'setting',
          operation: 'update',
          id: setting._id,
          data: {
            payCycle: setting.payCycle,
            estimatedPay: setting.estimatedPay,
            expectedPayDate: setting.expectedPayDate,
            darkModeEnabled: setting.darkModeEnabled,
            hideValues: setting.hideValues,
          },
          serverUpdatedAt: setting._serverUpdatedAt,
        });
      }

      return {
        changes,
        serverTime: new Date(),
        hasMore: changes.length >= 100,
      };
    } catch (error) {
      logger.error('Failed to download changes', { error, userId });
      throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Failed to download changes');
    }
  }

  /**
   * Log sync operation
   */
  private async logSync(
    userId: string,
    operation: 'upload' | 'download',
    details: {
      changesCount?: number;
      syncedCount?: number;
      failedCount?: number;
      conflictCount?: number;
      status: 'success' | 'failed' | 'partial';
    }
  ): Promise<void> {
    try {
      const log = new SyncLog({
        userId,
        operation,
        status: details.status,
        changesCount: details.changesCount || 0,
        syncedCount: details.syncedCount || 0,
        failedCount: details.failedCount || 0,
        conflictCount: details.conflictCount || 0,
        lastSyncAt: new Date(),
      });

      await log.save();
    } catch (error) {
      logger.error('Failed to log sync', { error });
    }
  }
}

export const syncService = new SyncService();
