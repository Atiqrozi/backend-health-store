import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    method: String,
    amount: Number,
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    transactionId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
