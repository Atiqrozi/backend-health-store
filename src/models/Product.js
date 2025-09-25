import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    category: { type: String, required: true },
    brand: { type: String, default: "Generic" }, // Brand field for filtering
    sku: String,
    batchNumber: String,
    expirationDate: Date,
    prescriptionRequired: { type: Boolean, default: false },
    dosageInfo: String,
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    images: [String],
    tags: [String], // Additional tags for better search
    rating: { type: Number, default: 0 }, // Product rating
    reviewCount: { type: Number, default: 0 }, // Number of reviews
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
