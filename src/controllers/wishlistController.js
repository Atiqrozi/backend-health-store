import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// Dapatkan semua wishlist milik user
export const getUserWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: "productId",
        populate: {
          path: "vendorId",
          select: "storeName",
        },
      })
      .sort({ addedAt: -1 });

    res.json({
      wishlist: wishlist.map((item) => ({
        _id: item._id,
        product: item.productId,
        addedAt: item.addedAt,
      })),
    });
  } catch (err) {
    console.error("Get wishlist error:", err);
    res.status(500).json({ message: "Gagal mengambil wishlist." });
  }
};

// Tambah produk ke wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // Cek apakah produk ada
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan." });
    }

    // Cek apakah sudah ada di wishlist
    const existingWishlist = await Wishlist.findOne({
      userId: req.user._id,
      productId,
    });

    if (existingWishlist) {
      return res.status(400).json({ message: "Produk sudah ada dalam wishlist." });
    }

    // Tambah ke wishlist
    const wishlistItem = await Wishlist.create({
      userId: req.user._id,
      productId,
    });

    const populatedItem = await Wishlist.findById(wishlistItem._id).populate({
      path: "productId",
      populate: {
        path: "vendorId",
        select: "storeName",
      },
    });

    res.status(201).json({
      message: "Produk berhasil ditambahkan ke wishlist.",
      wishlistItem: {
        _id: populatedItem._id,
        product: populatedItem.productId,
        addedAt: populatedItem.addedAt,
      },
    });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ message: "Gagal menambahkan ke wishlist." });
  }
};

// Hapus produk dari wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedItem = await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId,
    });

    if (!deletedItem) {
      return res.status(404).json({ message: "Produk tidak ditemukan dalam wishlist." });
    }

    res.json({ message: "Produk berhasil dihapus dari wishlist." });
  } catch (err) {
    console.error("Remove from wishlist error:", err);
    res.status(500).json({ message: "Gagal menghapus dari wishlist." });
  }
};

// Cek apakah produk ada dalam wishlist user
export const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      userId: req.user._id,
      productId,
    });

    res.json({
      isInWishlist: !!wishlistItem,
      wishlistId: wishlistItem?._id || null,
    });
  } catch (err) {
    console.error("Check wishlist status error:", err);
    res.status(500).json({ message: "Gagal mengecek status wishlist." });
  }
};

// Clear semua wishlist user
export const clearWishlist = async (req, res) => {
  try {
    await Wishlist.deleteMany({ userId: req.user._id });
    res.json({ message: "Wishlist berhasil dikosongkan." });
  } catch (err) {
    console.error("Clear wishlist error:", err);
    res.status(500).json({ message: "Gagal mengosongkan wishlist." });
  }
};
