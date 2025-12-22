import { Schema, model, Document, Types } from "mongoose";

// SaaS Plan Types
export type GymPlan = string;
export type GymStatus = "trial" | "active" | "suspended" | "expired";

// Feature Flags Interface
export interface IGymFeatures {
  payments: boolean;
  attendance: boolean;
  pt: boolean;
  classes: boolean;
  memberPortal: boolean;
}

export interface IGym extends Document {
  name: string;
  address?: string;
  phone?: string;
  owner: Types.ObjectId;

  // SaaS Fields
  plan: GymPlan;
  status: GymStatus;
  trialEndsAt?: Date;
  features: IGymFeatures;

  // Soft Delete
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const gymSchema = new Schema<IGym>(
  {
    name: { type: String, required: true },
    address: String,
    phone: String,
    owner: { type: Schema.Types.ObjectId, ref: "User", required: false },

    // SaaS Fields
    plan: {
      type: String,
      default: "pro",
      required: true
    },
    status: {
      type: String,
      enum: ["trial", "active", "suspended", "expired"],
      default: "active",
      required: true
    },
    trialEndsAt: {
      type: Date,
      required: function (this: IGym) {
        return this.status === "trial";
      }
    },
    features: {
      payments: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      pt: { type: Boolean, default: true },
      classes: { type: Boolean, default: true },
      memberPortal: { type: Boolean, default: true }
    },

    // Soft Delete
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Indexes for performance
gymSchema.index({ owner: 1 });
gymSchema.index({ status: 1 });
gymSchema.index({ plan: 1 });
gymSchema.index({ deletedAt: 1 });
gymSchema.index({ status: 1, plan: 1 }); // Compound index for filtering

// Pre-save hook to validate trial end date
gymSchema.pre('save', function (next) {
  if (this.status === 'trial' && !this.trialEndsAt) {
    // Set default trial period to 14 days if not specified
    this.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  }
  next();
});

export const Gym = model<IGym>("Gym", gymSchema);
