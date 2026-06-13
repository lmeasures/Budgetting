// API request/response types
export interface BudgetItem {
  id: string;
  name: string;
  description?: string;
  value: number;
  cycleType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isPaid: boolean;
  lastPaidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  _syncState: 'synced' | 'pending' | 'failed' | 'conflicted';
  _clientUpdatedAt?: Date;
  _serverUpdatedAt?: Date;
  _clientId?: string;
}

export interface UserSettings {
  payCycle: 'weekly' | 'biweekly' | 'monthly';
  estimatedPay: number;
  expectedPayDate: number;
  darkModeEnabled: boolean;
  hideValues: boolean;
  currency: string;
  updatedAt: Date;
  _syncState: 'synced' | 'pending' | 'failed' | 'conflicted';
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  passphraseHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncChange {
  type: 'budgetItem' | 'setting' | 'user';
  operation: 'create' | 'update' | 'delete';
  id: string;
  data?: Record<string, unknown>;
  clientUpdatedAt?: Date;
  serverUpdatedAt?: Date;
  clientId?: string;
}

export interface SyncUploadRequest {
  changes: SyncChange[];
}

export interface SyncUploadResponse {
  synced: number;
  failed: number;
  conflicts: number;
  results: Array<{
    id: string;
    status: 'synced' | 'failed' | 'conflicted';
    serverUpdatedAt?: Date;
    error?: string;
  }>;
  serverTime: Date;
}

export interface AuthTokenPayload {
  userId: string;
  clientId?: string;
  iat: number;
  exp: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
