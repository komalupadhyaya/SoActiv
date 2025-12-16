import mongoose, { Schema, Document } from 'mongoose';

// Schedule Event Types
export type ScheduleEventType = 'followup' | 'member-session' | 'class' | 'task' | 'self-reminder' | 'member-checkin' | 'holiday' | 'pt_expiry' | 'membership_expiry' | 'admin_task' | 'manager_task';

// Schedule Status
export type ScheduleStatus = 'pending' | 'completed' | 'cancelled' | 'rescheduled';

// Role Scope
export type RoleScope = 'manager' | 'trainer' | 'sales' | 'receptionist';

export interface ISchedule extends Document {
  // Core Fields
  title: string;
  description?: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: ScheduleStatus;

  // RBAC Fields
  adminId: mongoose.Types.ObjectId; // The Admin ID (owner of the gym account)
  createdBy: mongoose.Types.ObjectId; // User who created this event (Admin or Manager)
  assignedTo: mongoose.Types.ObjectId[]; // Staff assigned to this event
  roleScope: RoleScope[]; // Roles that can view this event
  type: ScheduleEventType;

  // Time Fields
  // Time Fields
  startTime?: string;
  endTime?: string;

  // Holiday Range
  startDate?: Date;
  endDate?: Date;
  holidayType?: 'full_day' | 'first_half' | 'second_half';

  isEditable: boolean;

  // Related Entities
  relatedFollowUp?: mongoose.Types.ObjectId;
  relatedMember?: mongoose.Types.ObjectId;
  relatedClass?: mongoose.Types.ObjectId;

  // Completion Tracking
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  completionNotes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema: Schema = new Schema(
  {
    // Core Fields
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending'
    },

    // RBAC Fields
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true
    },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      index: true
    }],
    roleScope: {
      type: [String],
      enum: ['manager', 'trainer', 'sales', 'receptionist'],
      default: []
    },
    type: {
      type: String,
      enum: ['followup', 'member-session', 'class', 'task', 'self-reminder', 'member-checkin', 'pt_expiry', 'membership_expiry', 'admin_task', 'manager_task', 'holiday'],
      required: [true, 'Event type is required'],
      index: true
    },
    holidayType: {
      type: String,
      enum: ['full_day', 'first_half', 'second_half'],
      required: function (this: any) { return this.type === 'holiday'; }
    },

    // Holiday Date Range (Required for holidays)
    startDate: {
      type: Date,
      required: function (this: any) { return this.type === 'holiday'; }
    },
    endDate: {
      type: Date,
      required: function (this: any) { return this.type === 'holiday'; }
    },

    // Time Fields
    startTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
    },
    endTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
    },

    isEditable: {
      type: Boolean,
      default: true
    },

    // Related Entities
    relatedFollowUp: {
      type: Schema.Types.ObjectId,
      ref: 'FollowUp'
    },
    relatedMember: {
      type: Schema.Types.ObjectId,
      ref: 'Client'
    },
    relatedClass: {
      type: Schema.Types.ObjectId,
      ref: 'Class'
    },

    // Completion Tracking
    completedAt: {
      type: Date
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff'
    },
    completionNotes: {
      type: String,
      maxlength: [500, 'Completion notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for Performance
ScheduleSchema.index({ adminId: 1, scheduledDate: 1 });
ScheduleSchema.index({ assignedTo: 1, scheduledDate: 1 });
ScheduleSchema.index({ adminId: 1, type: 1, status: 1 });

// Pre-save hook to auto-set completedAt when status changes to completed
ScheduleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Pre-update hook for findOneAndUpdate
ScheduleSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  if (update.$set && update.$set.status === 'completed' && !update.$set.completedAt) {
    update.$set.completedAt = new Date();
  }
  next();
});

const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);

export default Schedule;
