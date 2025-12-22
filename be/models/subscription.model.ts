import { Schema, model, Document, Types } from "mongoose";

// Subscription Status Types
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

// Billing Cycle Types
export type BillingCycle = "monthly" | "yearly";

export interface ISubscription extends Document {
    gymId: Types.ObjectId;
    plan: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    amount: number;
    currency: string;
    nextBillingDate?: Date;
    paymentMethod?: string; // Future: Stripe/Razorpay payment method ID
    stripeSubscriptionId?: string; // Future: Stripe subscription ID
    razorpaySubscriptionId?: string; // Future: Razorpay subscription ID
    canceledAt?: Date;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
    {
        gymId: {
            type: Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
            unique: true, // One subscription per gym
            index: true
        },
        plan: {
            type: String,
            required: true,
            default: "pro"
        },
        status: {
            type: String,
            enum: ["active", "past_due", "canceled", "trialing"],
            required: true,
            default: "trialing",
            index: true
        },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            required: true,
            default: "monthly"
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        currency: {
            type: String,
            required: true,
            default: "INR",
            uppercase: true
        },
        nextBillingDate: {
            type: Date,
            required: function (this: ISubscription) {
                return this.status === "active" || this.status === "past_due";
            }
        },
        paymentMethod: {
            type: String,
            trim: true
        },
        stripeSubscriptionId: {
            type: String,
            trim: true,
            sparse: true
        },
        razorpaySubscriptionId: {
            type: String,
            trim: true,
            sparse: true
        },
        canceledAt: {
            type: Date
        },
        cancelReason: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
);

// Indexes for performance
subscriptionSchema.index({ status: 1, nextBillingDate: 1 }); // For finding due subscriptions
subscriptionSchema.index({ plan: 1 });

// Pre-save hook to calculate next billing date
subscriptionSchema.pre('save', function (next) {
    if (this.isNew && !this.nextBillingDate && (this.status === 'active' || this.status === 'trialing')) {
        const daysToAdd = this.billingCycle === 'monthly' ? 30 : 365;
        this.nextBillingDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    next();
});

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
