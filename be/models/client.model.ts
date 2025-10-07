import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IClient extends Document {
  userId: Types.ObjectId;
   _id: string;

  // Personal Information
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  email: string;
  contactNumber: string;
  address?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: 'parent' | 'spouse' | 'sibling' | 'friend' | 'child' | 'other';

  // Staff Assignment
  salesRep?: Types.ObjectId;
  memberManager?: Types.ObjectId;
  trainer?: Types.ObjectId;

  // Club & Membership
  attendanceId?: string;
  clubId?: string;
  gstNo?: string;

  // Membership Dates
  startDate: Date;
  endDate: Date;
  remainingDays: number;
  status: 'active' | 'expired' | 'pending';

  // Package & Add-ons
  packagePrice: number;
  hasPersonalTraining: boolean;
  personalTrainer?: Types.ObjectId;
  personalTrainingDurationWeeks?: number;
  personalTrainingPrice?: number;

  // Plan Type
  plan: 'basic' | 'premium';

  // Timing (Simple String - No Restrictions)
  timing: string;

  // Notifications
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    dateOfBirth: {
      type: Date,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      unique: true,
      match: [/^[\+]?[0-9\s\-\(\)]{10,}$/, 'Please enter a valid phone number'],
    },
    address: {
      type: String,
      trim: true,
    },

    // Emergency Contact
    emergencyContactName: {
      type: String,
      trim: true,
    },
    emergencyContactNumber: {
      type: String,
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]{10,}$/, 'Please enter a valid emergency phone number'],
    },
    emergencyContactRelation: {
      type: String,
      enum: ['parent', 'spouse', 'sibling', 'friend', 'child', 'other'],
    },

    // Staff Assignment
    salesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    memberManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },

    // Club & Billing
    attendanceId: {
      type: String,
      unique: true,
      sparse: true,
    },
    clubId: {
      type: String,
    },
    gstNo: {
      type: String,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, 'Invalid GST number format'],
    },

    // Membership Dates
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    remainingDays: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'expired', 'pending'],
        message: 'Status must be either "active", "expired", or "pending"',
      },
      default: 'active',
    },

    // Package & Add-ons
    packagePrice: {
      type: Number,
      required: [true, 'Package price is required'],
      min: [0, 'Package price cannot be negative'],
    },

    hasPersonalTraining: {
      type: Boolean,
      default: false,
    },
    personalTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      validate: {
        validator: function (this: IClient, value: Types.ObjectId) {
          return !this.hasPersonalTraining || !!value;
        },
        message: 'Personal trainer is required when personal training is enabled',
      },
    },
    personalTrainingDurationWeeks: {
      type: Number,
      validate: {
        validator: function (this: IClient, value: number) {
          return !this.hasPersonalTraining || (value && value > 0);
        },
        message: 'Personal training duration must be greater than 0',
      },
    },
    personalTrainingPrice: {
      type: Number,
      validate: {
        validator: function (this: IClient, value: number) {
          return !this.hasPersonalTraining || (value !== undefined && value >= 0);
        },
        message: 'Personal training price must be 0 or more',
      },
    },

    // Plan Type
    plan: {
      type: String,
      enum: {
        values: ['basic', 'premium'],
        message: 'Plan must be either "basic" or "premium"',
      },
      required: [true, 'Membership plan is required'],
      default: 'basic',
    },

    // ✅ Simple Timing Field – Free Text
    timing: {
      type: String,
      required: [true, 'Timing is required for membership access'],
      trim: true,
    },

    // Notifications
    notifications: {
      sms: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Calculate remainingDays and update status
clientSchema.pre('save', function (next) {
  if (this.endDate) {
    const today = new Date();
    const end = new Date(this.endDate);
    const timeDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    this.remainingDays = daysDiff;
    this.status = daysDiff > 0 ? 'active' : 'expired';
  }
  next();
});

export const Client = model<IClient>('Client', clientSchema);