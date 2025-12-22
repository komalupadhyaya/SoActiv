import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContactCategory = 'sales' | 'support' | 'billing' | 'feature_request' | 'other';
export type ContactSource = 'public' | 'admin';
export type ContactStatus = 'new' | 'read' | 'closed';

export interface IContact extends Document {
    name: string;
    email: string;
    phone?: string;
    gymId?: Types.ObjectId;
    category: ContactCategory;
    message: string;
    source: ContactSource;
    status: ContactStatus;
    createdAt: Date;
    updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        phone: {
            type: String,
            trim: true,
        },
        gymId: {
            type: Schema.Types.ObjectId,
            ref: 'Gym',
            default: null,
        },
        category: {
            type: String,
            enum: ['sales', 'support', 'billing', 'feature_request', 'other'],
            required: [true, 'Category is required'],
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            immutable: true, // Messages are read-only after creation
        },
        source: {
            type: String,
            enum: ['public', 'admin'],
            required: true,
        },
        status: {
            type: String,
            enum: ['new', 'read', 'closed'],
            default: 'new',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
contactSchema.index({ status: 1 });
contactSchema.index({ category: 1 });
contactSchema.index({ createdAt: -1 });

export const Contact = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;
