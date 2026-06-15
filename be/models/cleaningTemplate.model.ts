import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICleaningTemplate extends Document {
  adminId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CleaningTemplateSchema = new Schema<ICleaningTemplate>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Cleaner staff assignment is required'],
      unique: true, // One template per cleaner
      index: true
    },
    items: {
      type: [String],
      required: [true, 'Checklist template items are required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'A template must contain at least one task item.'
      }
    }
  },
  {
    timestamps: true
  }
);

export const CleaningTemplate = mongoose.model<ICleaningTemplate>('CleaningTemplate', CleaningTemplateSchema);
