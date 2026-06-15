import mongoose, { Schema, Document, model } from 'mongoose';

export interface IMilestone {
  _id?: mongoose.Types.ObjectId;
  title: string;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface IWeeklyLog {
  _id?: mongoose.Types.ObjectId;
  weekStartDate: Date;
  loggedValue: number;
  notes?: string;
  createdAt: Date;
}

export interface IFitnessGoal extends Document {
  member: mongoose.Types.ObjectId;
  title: string;
  type: 'weight' | 'muscle' | 'stamina' | 'steps' | 'other';
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'completed' | 'abandoned';
  deadline?: Date;
  milestones: IMilestone[];
  weeklyLogs: IWeeklyLog[];
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  targetValue: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const weeklyLogSchema = new Schema<IWeeklyLog>({
  weekStartDate: { type: Date, required: true, default: Date.now },
  loggedValue: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const fitnessGoalSchema = new Schema<IFitnessGoal>(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['weight', 'muscle', 'stamina', 'steps', 'other'],
      required: true
    },
    startValue: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    unit: { type: String, required: true, default: 'kg' },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active'
    },
    deadline: { type: Date },
    milestones: [milestoneSchema],
    weeklyLogs: [weeklyLogSchema]
  },
  { timestamps: true }
);

// High speed indexes for fast querying of member goals
fitnessGoalSchema.index({ member: 1, status: 1 });

export const FitnessGoal = model<IFitnessGoal>('FitnessGoal', fitnessGoalSchema);
export default FitnessGoal;
