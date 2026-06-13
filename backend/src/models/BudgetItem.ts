import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetItem extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  value: number;
  cycleType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isPaid: boolean;
  lastPaidDate?: Date;
  _syncState: 'synced' | 'pending' | 'failed' | 'conflicted';
  _clientUpdatedAt?: Date;
  _serverUpdatedAt: Date;
  _clientId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const budgetItemSchema = new Schema<IBudgetItem>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 255 },
    description: { type: String, maxlength: 1000 },
    value: { type: Number, required: true, min: 0 },
    cycleType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    isPaid: { type: Boolean, default: false },
    lastPaidDate: { type: Date },
    _syncState: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'conflicted'],
      default: 'pending',
    },
    _clientUpdatedAt: { type: Date },
    _serverUpdatedAt: { type: Date, default: () => new Date() },
    _clientId: { type: String },
  },
  { timestamps: true }
);

// Index for querying by user and date range
budgetItemSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const BudgetItem = mongoose.model<IBudgetItem>('BudgetItem', budgetItemSchema);
