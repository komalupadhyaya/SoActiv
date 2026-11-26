import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IServiceVariation {
  _id?: string | Types.ObjectId;
  name: string;
  duration?: string;
  price: number;
  sessions?: string | number;
  sacCode?: string;
  description?: string;
  status?: boolean;
  serviceType?: string;
  timeHours?: number;
  timeMinutes?: number;
  daysPerWeek?: string;
  months?: number;
  validityInDays?: number;
  maxMembers?: number;
  tax?: string;
  accessType?: string;
  category?: string;
  otpVerification?: boolean;
  upgradable?: boolean;
  transferable?: boolean;
  appointmentsApplicable?: boolean;
  allowFreeze?: boolean;
  maxFreezeDays?: number;
  minFreezeDays?: number;
  registrationFee?: boolean;
  minFeeLimit?: number;
  maxFeeLimit?: number;
  eligibleForReferralBonus?: boolean;
  referralBonusFromPurchase?: boolean;
  termBatchDate?: boolean;
  promoteOnWebsite?: boolean;
}

export interface IService extends Document {
  _id: string;
  name: string;
  categoryType: 'brand' | 'aktvity';
  sacCode?: string;
  tax?: number | string;
  description?: string;
  promote: boolean;
  status: boolean;
  order?: number;
  variations: IServiceVariation[];
  adminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceVariationSchema = new Schema<IServiceVariation>(
  {
    name: { type: String, required: true, trim: true },
    duration: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    sessions: { type: Schema.Types.Mixed, default: 'NaN' },
    sacCode: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: Boolean, default: true },
    serviceType: { type: String, default: '' },
    timeHours: { type: Number, default: 0 },
    timeMinutes: { type: Number, default: 15 },
    daysPerWeek: { type: String, default: '1 Day Per week' },
    months: { type: Number, default: 1 },
    validityInDays: { type: Number, default: 1 },
    maxMembers: { type: Number, default: 1 },
    tax: { type: String, default: 'No Tax' },
    accessType: { type: String, default: 'Individual' },
    category: { type: String, default: 'General Membership' },
    otpVerification: { type: Boolean, default: false },
    upgradable: { type: Boolean, default: true },
    transferable: { type: Boolean, default: false },
    appointmentsApplicable: { type: Boolean, default: false },
    allowFreeze: { type: Boolean, default: true },
    maxFreezeDays: { type: Number, default: 0 },
    minFreezeDays: { type: Number, default: 1 },
    registrationFee: { type: Boolean, default: false },
    minFeeLimit: { type: Number, default: 0 },
    maxFeeLimit: { type: Number, default: 0 },
    eligibleForReferralBonus: { type: Boolean, default: false },
    referralBonusFromPurchase: { type: Boolean, default: false },
    termBatchDate: { type: Boolean, default: false },
    promoteOnWebsite: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    categoryType: { type: String, enum: ['brand', 'aktvity'], default: 'brand' },
    sacCode: { type: String, default: '' },
    tax: { type: Schema.Types.Mixed, default: 'No tax' },
    description: { type: String, default: '' },
    promote: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    variations: [serviceVariationSchema],
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Service = model<IService>('Service', serviceSchema);
