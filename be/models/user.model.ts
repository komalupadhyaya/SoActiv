import mongoose, { Model, Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 👇 Frontend User type (shared with frontend)
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  gym?: string; // <— Added for tenant tracking
  avatar?: string; // Added avatar field
  createdAt: string;
  avatarSettings?: {
    textColor?: string;
    backgroundColor?: string;
    backgroundType?: 'solid' | 'gradient';
    gradientStart?: string;
    gradientEnd?: string;
  };
  currentSessionId?: string;
  sessionCreatedAt?: string;
  tokenVersion: number;
}

export interface AvatarSettings {
  textColor: string;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient';
  gradientStart: string;
  gradientEnd: string;
}

// 👇 Methods Interface
interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  toFrontendUser(): User;
}

// 👇 DB Document Interface
export interface IUser extends Document, IUserMethods {
  _id: Types.ObjectId;
  fullname: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  avatarSettings?: AvatarSettings;
  role: 'superadmin' | 'admin' | 'staff' | 'trainer' | 'member';
  gym?: Types.ObjectId;
  owner?: Types.ObjectId; // Added missing property
  createdAt: Date;
  updatedAt: Date;

  // Session Management Fields
  currentSessionId?: string;
  sessionCreatedAt?: Date;
  tokenVersion: number;

  // Online Status
  lastActiveAt?: Date;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: false },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["member", "admin", "staff", "trainer", "superadmin"],
      default: "member",

    },
    gym: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: function (this: any) {
        return this.role !== "superadmin";
      },
    },
    tokenVersion: {
      type: Number,
      default: 0, // Incremented on each login
    },
    lastActiveAt: {
      type: Date,
    },

    // Session Management Fields
    currentSessionId: {
      type: String,
      default: null,
    },
    sessionCreatedAt: {
      type: Date,
      default: null,
    },

    avatarSettings: {
      textColor: { type: String, default: '#FFFFFF' },
      backgroundColor: { type: String, default: '#3B82F6' },
      backgroundType: { type: String, enum: ['solid', 'gradient'], default: 'solid' },
      gradientStart: { type: String, default: '#3B82F6' },
      gradientEnd: { type: String, default: '#8B5CF6' }
    },
  },
  { timestamps: true }
);

// 👇 Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// 👇 Password check
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// 👇 Generate JWT
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      gym: this.gym,
      sessionId: this.currentSessionId,      // Include session ID
      tokenVersion: this.tokenVersion,       // Include token version
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "7d" } as any
  );
};

// 👇 Convert to frontend-safe User object
userSchema.methods.toFrontendUser = function (): User {
  return {
    id: this._id.toString(),
    name: this.fullname,
    email: this.email,
    phone: this.phone || "",
    role: this.role,
    gym: this.gym?.toString(),
    avatar: this.avatar,
    avatarSettings: this.avatarSettings,
    createdAt: this.createdAt.toISOString(),
    tokenVersion: this.tokenVersion,
  };
};

export const User = model<IUser, UserModel>("User", userSchema);
