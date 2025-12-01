import { Schema, model, Document, Types } from "mongoose";

export interface IGym extends Document {
  name: string;
  address?: string;
  phone?: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gymSchema = new Schema<IGym>(
  {
    name: { type: String, required: true },
    address: String,
    phone: String,
    owner: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

export const Gym = model<IGym>("Gym", gymSchema);
