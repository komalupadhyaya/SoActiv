import { Model, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 👇 Frontend User type (shared with frontend)
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

// 👇 DB Document Interface
interface IUser {
  _id: string;
  fullname: string;
  email: string;
  phone?: string;
  avatar: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// 👇 Define methods here so TypeScript knows they exist
interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  toFrontendUser(): User;
}

// 👇 Full model type
type UserModel = Model<IUser, {}, IUserMethods>;

// 👇 Schema
const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
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
      enum: ["user", "admin", "sales", "trainer", "frontdesk"],
      default: "user",
    },
  },
  { timestamps: true }
);

// 👇 Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 👇 Password check
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// 👇 Generate JWT
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: this.role },
    process.env.ACCESS_TOKEN_SECRET || "your-secret-key",
    {
      expiresIn: "7d", 
    }
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
    createdAt: this.createdAt.toISOString(),
  };
};

// 👇 Create and export model
export const User = model<IUser, UserModel>("User", userSchema);