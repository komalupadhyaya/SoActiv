import mongoose, { Schema, Document, model } from 'mongoose';

export interface IProgressPhoto extends Document {
  member: mongoose.Types.ObjectId;
  frontPhoto?: string;
  sidePhoto?: string;
  backPhoto?: string;
  weight?: number;
  bodyFat?: number;
  notes?: string;
  takenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressPhotoSchema = new Schema<IProgressPhoto>(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    frontPhoto: { type: String },
    sidePhoto: { type: String },
    backPhoto: { type: String },
    weight: { type: Number },
    bodyFat: { type: Number },
    notes: { type: String },
    takenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Speed up member timeline retrievals
progressPhotoSchema.index({ member: 1, takenAt: -1 });

export const ProgressPhoto = model<IProgressPhoto>('ProgressPhoto', progressPhotoSchema);
export default ProgressPhoto;
