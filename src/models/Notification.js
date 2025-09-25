import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    meta: Object,
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
