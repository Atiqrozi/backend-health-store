import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index untuk memastikan satu user hanya bisa menambahkan satu produk sekali ke wishlist
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
