import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IClient extends Document {
  userId: Types.ObjectId;
  _id: string;

  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  email: string;
  contactNumber: string;
  address?: string;
  profileImage?: string;

  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: 'parent' | 'spouse' | 'sibling' | 'friend' | 'child' | 'other';

  salesRep?: Types.ObjectId;
  memberManager?: Types.ObjectId;
  trainer?: Types.ObjectId;

  attendanceId?: string;
  clubId?: string;
  gstNo?: string;

  startDate: Date;
  endDate: Date;
  remainingDays: number;
  status: 'active' | 'expired' | 'pending' | 'inactive';

  packagePrice: number;
  hasPersonalTraining: boolean;
  personalTrainer?: Types.ObjectId;
  personalTrainingDurationWeeks?: number;
  personalTrainingPrice?: number;

  plan: 'basic' | 'premium';
  timing: string;
  paymentMode?: string;
  invoice?: any;
  invoices?: any[];
  freezes?: any[];
  freezeInfo?: any;
  dateChanges?: any[];
  transfersSent?: any[];
  transfersReceived?: any[];

  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };

  deleteRequested?: boolean;
  deleteRequestedBy?: Types.ObjectId;
  deleteRequestedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    fullName: { type: String, required: true, trim: true, minlength: 2 },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    dateOfBirth: Date,

    email: { 
      type: String, 
      required: true, 
      trim: true, 
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]{10,}$/, 'Invalid phone number'],
    },
    address: String,
    profileImage: { type: String, default: '' },

    emergencyContactName: {
      type: String,
      match: [/^[a-zA-Z\s]*$/, 'Emergency contact name must contain only alphabetical characters and spaces'],
      trim: true,
      set: (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
    },
    emergencyContactNumber: { 
      type: String, 
      trim: true,
      set: (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
    },
    emergencyContactRelation: { 
      type: String, 
      enum: ['parent', 'spouse', 'sibling', 'friend', 'child', 'other'],
      set: (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim().toLowerCase() : undefined)
    },

    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    memberManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },

    attendanceId: {
      type: String,
      trim: true,
      set: (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
    },
    clubId: {
      type: String,
      trim: true,
      set: (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
    },
    gstNo: {
      type: String,
      uppercase: true,
      trim: true,
      set: (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
    },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    remainingDays: { type: Number, default: 365 },
    status: { type: String, enum: ['active', 'expired', 'pending', 'inactive'], default: 'active' },

    packagePrice: { type: Number, default: 0 },

    hasPersonalTraining: { type: Boolean, default: false },
    personalTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      validate: {
        validator: function (this: IClient, v: Types.ObjectId) {
          return !this.hasPersonalTraining || !v;
        },
        message: 'Personal trainer is required when personal training is enabled',
      },
    },
    personalTrainingDurationWeeks: {
      type: Number,
      validate: {
        validator: function (this: IClient, v: number) {
          return !this.hasPersonalTraining || (v && v > 0);
        },
        message: 'Duration must be > 0 when personal training is enabled',
      },
    },
    personalTrainingPrice: {
      type: Number,
      validate: {
        validator: function (this: IClient, v: number) {
          return !this.hasPersonalTraining || (v !== undefined && v >= 0);
        },
        message: 'Price must be >= 0 when personal training is enabled',
      },
    },

    plan: { type: String, enum: ['basic', 'premium'], required: true, default: 'basic' },
    timing: { type: String, trim: true, default: 'morning' },
    paymentMode: { type: String, trim: true, default: 'Google Pay' },
    invoice: { type: Schema.Types.Mixed },
    invoices: { type: [Schema.Types.Mixed], default: [] },
    freezes: { type: [Schema.Types.Mixed], default: [] },
    freezeInfo: { type: Schema.Types.Mixed },
    dateChanges: { type: [Schema.Types.Mixed], default: [] },
    transfersSent: { type: [Schema.Types.Mixed], default: [] },
    transfersReceived: { type: [Schema.Types.Mixed], default: [] },

    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
    },

    deleteRequested: { type: Boolean, default: false },
    deleteRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    deleteRequestedAt: { type: Date },
  },
  { timestamps: true }
);

/**
 * UNIQUE EMAIL & CONTACT PER USER
 */
clientSchema.index({ userId: 1, email: 1 }, { unique: true });
clientSchema.index({ userId: 1, contactNumber: 1 }, { unique: true });

/**
 * Pre-save hook: calculate remainingDays and status
 */
clientSchema.pre('save', function (next) {
  if (this.status === 'inactive') {
    this.remainingDays = 0;
    return next();
  }
  if (this.endDate) {
    const today = new Date();
    const end = new Date(this.endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    this.remainingDays = diff;
    this.status = diff > 0 ? 'active' : 'expired';
  }
  next();
});

/**
 * Pre-update hook for update operations
 */
clientSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as Partial<IClient>;
  if (update.status === 'inactive') {
    (update as any).remainingDays = 0;
    return next();
  }
  if (update.endDate) {
    const today = new Date();
    const end = new Date(update.endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    (update as any).remainingDays = diff;
    if (update.status !== 'inactive') {
      (update as any).status = diff > 0 ? 'active' : 'expired';
    }
  }
  next();
});

export const Client = model<IClient>('Client', clientSchema);

// Safely drop legacy unique attendanceId_1 index from MongoDB collection if present
Client.collection.dropIndex('attendanceId_1').catch(() => {
  // Silently ignore if index does not exist
});
