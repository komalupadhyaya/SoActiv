import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChecklistItem {
  _id?: Types.ObjectId;
  taskName: string;
  completed: boolean;
  completedAt?: Date | null;
}

export interface ICleaningChecklist extends Document {
  adminId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  dateStr: string; // Format: YYYY-MM-DD in local time
  items: IChecklistItem[];
  status: 'pending' | 'completed';
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>({
  taskName: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
});

const CleaningChecklistSchema = new Schema<ICleaningChecklist>(
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
      index: true
    },
    dateStr: {
      type: String,
      required: [true, 'Checklist date string is required'],
      index: true
    },
    items: {
      type: [ChecklistItemSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent multiple checklists for the same cleaner on the same day
CleaningChecklistSchema.index({ assignedTo: 1, dateStr: 1 }, { unique: true });

export const CleaningChecklist = mongoose.model<ICleaningChecklist>('CleaningChecklist', CleaningChecklistSchema);
