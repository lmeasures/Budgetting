import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  _id: string;
  userId: string;
  payCycle: 'weekly' | 'biweekly' | 'monthly';
  estimatedPay: number;
  expectedPayDate: number;
  darkModeEnabled: boolean;
  hideValues: boolean;
  currency: string;
  _syncState: 'synced' | 'pending' | 'failed' | 'conflicted';
  _serverUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true, unique: true, index: true },
    payCycle: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },
    estimatedPay: { type: Number, default: 0, min: 0 },
    expectedPayDate: { type: Number, default: 1, min: 1, max: 27 },
    darkModeEnabled: { type: Boolean, default: false },
    hideValues: { type: Boolean, default: false },
    currency: { type: String, default: 'USD', maxlength: 3 },
    _syncState: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'conflicted'],
      default: 'pending',
    },
    _serverUpdatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISetting>('Setting', settingSchema);
