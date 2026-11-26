// models/Enquiry.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// Define the Status and Source enums
type EnquiryStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
type EnquirySource = string;

// Interface for the Enquiry document (single record)
export interface IEnquiry extends Document {
  userId: Types.ObjectId; // Reference to User (optional: if linked to logged-in user who created it)
  adminId?: Types.ObjectId; // Reference to Gym Owner Admin ID for tenant isolation
  gymId?: Types.ObjectId | null; // Reference to Gym ID for strict tenant isolation
  name: string;
  phone: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  enquiryDate?: Date;
  serviceName?: string;
  enquiryType?: string;
  trialType?: 'no-trial' | 'trial-appointment' | 'trial-class' | 'trial-session' | string;
  trialDateTime?: Date | null;
  trialService?: string;
  trialStaff?: Types.ObjectId | null;
  trialClassDate?: Date | null;
  trialClass?: string;
  trialSessionDate?: Date | null;
  trialSession?: string;
  source: EnquirySource;
  status: EnquiryStatus;
  assignedStaff: Types.ObjectId | null; // Reference to Staff _id (can be null)
  followUpDate: Date | null;
  followUpDateTime?: Date | null;
  callTag?: 'cold' | 'warm' | 'hot' | '';
  followUpMessage?: string;
  comments: string;
  interests: string;
  budget: string;
  dateOfBirth?: Date | null;
  countryCode?: string;
  expiryDays: number; // Number of days until enquiry expires (default: 14)
  expiryDate: Date; // Calculated expiry date
  isExpired: boolean; // Auto-calculated based on current date
  remainingDays: number; // Days remaining until expiry
  createdAt: Date;
  updatedAt: Date;
}

// Interface for the Enquiry Model (static methods can go here if needed)
interface IEnquiryModel extends Model<IEnquiry> {
  // Add static methods here later if needed
  // e.g., findByStatus(status: EnquiryStatus): Promise<IEnquiry[]>
}

// Define the Schema
const EnquirySchema = new Schema<IEnquiry, IEnquiryModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: false,
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      required: false,
    },
    enquiryDate: {
      type: Date,
      default: Date.now,
    },
    serviceName: {
      type: String,
      default: '',
    },
    enquiryType: {
      type: String,
      default: '',
    },
    trialType: {
      type: String,
      enum: ['no-trial', 'trial-appointment', 'trial-class', 'trial-session', ''],
      default: 'no-trial',
    },
    trialDateTime: {
      type: Date,
      default: null,
    },
    trialService: {
      type: String,
      default: '',
    },
    trialStaff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    trialClassDate: {
      type: Date,
      default: null,
    },
    trialClass: {
      type: String,
      default: '',
    },
    trialSessionDate: {
      type: Date,
      default: null,
    },
    trialSession: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'Walk-in',
      required: false,
    },
    status: {
      type: String,
      enum: {
        values: ['new', 'contacted', 'interested', 'converted', 'lost'],
        message: 'Status must be one of: new, contacted, interested, converted, lost',
      },
      default: 'new',
      required: true,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff', // Reference to Staff model
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpDateTime: {
      type: Date,
      default: null,
    },
    callTag: {
      type: String,
      enum: ['cold', 'warm', 'hot', ''],
      default: '',
    },
    followUpMessage: {
      type: String,
      default: '',
      maxlength: [250, 'Message cannot exceed 250 characters'],
    },
    comments: {
      type: String,
      default: '',
      maxlength: [1000, 'Comments cannot exceed 1000 characters'],
    },
    interests: {
      type: String,
      default: '',
      maxlength: [500, 'Interests cannot exceed 500 characters'],
    },
    budget: {
      type: String,
      default: '',
      maxlength: [100, 'Budget range cannot exceed 100 characters'],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    expiryDays: {
      type: Number,
      default: 14, // Default: enquiries expire in 14 days
      min: [1, 'Expiry days must be at least 1'],
    },
    expiryDate: {
      type: Date,
      required: false, // Will be calculated automatically
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    remainingDays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Pre-save hook: Calculate expiry date and status
EnquirySchema.pre('save', function (next) {
  // Calculate expiry date based on createdAt + expiryDays
  if (this.isNew || this.isModified('expiryDays')) {
    const createdDate = this.createdAt || new Date();
    this.expiryDate = new Date(createdDate.getTime() + this.expiryDays * 24 * 60 * 60 * 1000);
  }

  // Calculate remaining days and expired status
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const timeDiff = expiry.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  this.remainingDays = daysDiff;
  this.isExpired = daysDiff <= 0;

  next();
});

// Optional: Add indexes
EnquirySchema.index({ gymId: 1, createdAt: -1 });
EnquirySchema.index({ gymId: 1, status: 1 });
EnquirySchema.index({ status: 1 });
EnquirySchema.index({ assignedStaff: 1 });
EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ isExpired: 1 });
EnquirySchema.index({ expiryDate: 1 });
EnquirySchema.index({ userId: 1, email: 1 }, { unique: true, sparse: true });

// Export the Mongoose Model
const Enquiry: IEnquiryModel = mongoose.model<IEnquiry, IEnquiryModel>('Enquiry', EnquirySchema);
// models/enquiry.model.ts

export default Enquiry;