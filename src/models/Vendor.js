import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storeName: { type: String, required: true },
    businessAddress: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
    documents: [String], // URL dokumen legal
    description: String,
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
