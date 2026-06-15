import mongoose, { Schema, Document, model } from 'mongoose';

export interface IExercise extends Document {
  adminId: mongoose.Types.ObjectId;
  title: string;
  category: 'Chest' | 'Back' | 'Legs' | 'Cardio' | 'Yoga';
  muscleTargeting: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  videoUrl: string;
  instructions: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Chest', 'Back', 'Legs', 'Cardio', 'Yoga'],
      required: true,
    },
    muscleTargeting: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: [String],
      required: true,
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// High speed index for tenant category filtering
exerciseSchema.index({ adminId: 1, category: 1, difficulty: 1 });

export const Exercise = model<IExercise>('Exercise', exerciseSchema);
export default Exercise;
