import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    sku: String,
    price: Number,
    qty: Number,
    subtotal: Number,
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    recipient: String,
    phone: String,
    address: String,
    postalCode: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: String,
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    orderStatus: { type: String, enum: ["pending", "diproses", "dikirim", "selesai", "dibatalkan"], default: "pending" },
    courier: String,
    trackingNumber: String,
    history: [
      {
        status: String,
        timestamp: Date,
      },
    ],
    total: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
