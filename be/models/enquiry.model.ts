// models/Enquiry.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// Define the Status and Source enums
type EnquiryStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
type EnquirySource =
  | 'website'
  | 'social-media'
  | 'referral'
  | 'walk-in'
  | 'advertisement'
  | 'other';

// Interface for the Enquiry document (single record)
export interface IEnquiry extends Document {
  userId: Types.ObjectId; // Reference to User (optional: if linked to logged-in user who created it)
  name: string;
  phone: string;
  email: string;
  source: EnquirySource;
  status: EnquiryStatus;
  assignedStaff: Types.ObjectId | null; // Reference to Staff _id (can be null)
  followUpDate: Date | null;
  comments: string;
  interests: string;
  budget: string;
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
      required: [true, 'User ID is required'],
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
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    source: {
      type: String,
      enum: {
        values: ['website', 'social-media', 'referral', 'walk-in', 'advertisement', 'other'],
        message: 'Invalid source type',
      },
      required: true,
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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Optional: Add indexes
EnquirySchema.index({ status: 1 });
EnquirySchema.index({ assignedStaff: 1 });
EnquirySchema.index({ createdAt: -1 });

// Export the Mongoose Model
const Enquiry: IEnquiryModel = mongoose.model<IEnquiry, IEnquiryModel>('Enquiry', EnquirySchema);

export default Enquiry;