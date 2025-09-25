import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: String,
    recipient: String,
    phone: String,
    address: String,
    postalCode: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "vendor", "user"], default: "user" },
    phone: String,
    address: [addressSchema],
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
