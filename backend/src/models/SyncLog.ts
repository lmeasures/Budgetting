import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncLog extends Document {
  _id: string;
  userId: string;
  operation: 'upload' | 'download';
  status: 'success' | 'failed' | 'partial';
  changesCount: number;
  conflictCount: number;
  syncedCount: number;
  failedCount: number;
  lastSyncAt: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const syncLogSchema = new Schema<ISyncLog>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true, index: true },
    operation: { type: String, enum: ['upload', 'download'], required: true },
    status: { type: String, enum: ['success', 'failed', 'partial'], required: true },
    changesCount: { type: Number, default: 0 },
    conflictCount: { type: Number, default: 0 },
    syncedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    lastSyncAt: { type: Date, default: () => new Date() },
    error: { type: String },
  },
  { timestamps: true }
);

// TTL index: keep sync logs for 90 days
syncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const SyncLog = mongoose.model<ISyncLog>('SyncLog', syncLogSchema);
