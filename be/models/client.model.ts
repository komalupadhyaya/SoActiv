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
  status: 'active' | 'expired' | 'pending';

  packagePrice: number;
  hasPersonalTraining: boolean;
  personalTrainer?: Types.ObjectId;
  personalTrainingDurationWeeks?: number;
  personalTrainingPrice?: number;

  plan: 'basic' | 'premium';
  timing: string;

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

    emergencyContactName: {
      type: String,
      match: [/^[a-zA-Z\s]*$/, 'Emergency contact name must contain only alphabetical characters and spaces'],
      trim: true
    },
    emergencyContactNumber: { type: String, trim: true },
    emergencyContactRelation: { type: String, enum: ['parent', 'spouse', 'sibling', 'friend', 'child', 'other'] },

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

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    remainingDays: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'expired', 'pending'], default: 'active' },

    packagePrice: { type: Number, required: true, min: 1, max: 100000 },

    hasPersonalTraining: { type: Boolean, default: false },
    personalTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      validate: {
        validator: function (this: IClient, v: Types.ObjectId) {
          return !this.hasPersonalTraining || !!v;
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
    timing: { type: String, required: true, trim: true },

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
  if (update.endDate) {
    const today = new Date();
    const end = new Date(update.endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    (update as any).remainingDays = diff;
    (update as any).status = diff > 0 ? 'active' : 'expired';
  }
  next();
});

export const Client = model<IClient>('Client', clientSchema);

// Safely drop legacy unique attendanceId_1 index from MongoDB collection if present
Client.collection.dropIndex('attendanceId_1').catch(() => {
  // Silently ignore if index does not exist
});
