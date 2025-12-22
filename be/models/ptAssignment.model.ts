import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IPTAssignment extends Document {
    memberId: Types.ObjectId; // Client
    planId: Types.ObjectId; // PTPlan
    trainerId: Types.ObjectId; // Staff (assignedTo)
    assignedTo?: Types.ObjectId; // Virtual or Alias? Let's just track trainerId as primary.
    adminId: Types.ObjectId; // User (Gym Owner)
    createdBy?: Types.ObjectId;
    startDate: Date;
    expiryDate: Date;
    totalSessions: number;
    usedSessions: number;
    status: 'active' | 'expired' | 'completed' | 'cancelled';
    sessionLogs: Array<{
        date: Date;
        notes?: string;
        loggedBy: Types.ObjectId; // Staff ID
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ptAssignmentSchema = new Schema<IPTAssignment>(
    {
        memberId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
        planId: { type: Schema.Types.ObjectId, ref: 'PTPlan', required: true },
        trainerId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        startDate: { type: Date, required: true },
        expiryDate: { type: Date, required: true },
        totalSessions: { type: Number, required: true, min: 1 },
        usedSessions: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ['active', 'expired', 'completed', 'cancelled'],
            default: 'active',
            index: true
        },
        sessionLogs: [{
            date: { type: Date, default: Date.now },
            notes: String,
            loggedBy: { type: Schema.Types.ObjectId, ref: 'Staff' }
        }]
    },
    { timestamps: true }
);

// Indexes for fast lookup
ptAssignmentSchema.index({ adminId: 1, status: 1 });
ptAssignmentSchema.index({ trainerId: 1, status: 1 });
ptAssignmentSchema.index({ expiryDate: 1 }); // For finding expiring assignments

// Pre-save to check expiry/completion
ptAssignmentSchema.pre('save', function (next) {
    // If sessions exhausted, mark completed
    if (this.usedSessions >= this.totalSessions && this.status === 'active') {
        this.status = 'completed';
    }
    // If update happens, check dates (though usually done by query)
    else if (this.expiryDate < new Date() && this.status === 'active') {
        this.status = 'expired';
    }
    next();
});

export const PTAssignment = model<IPTAssignment>('PTAssignment', ptAssignmentSchema);
