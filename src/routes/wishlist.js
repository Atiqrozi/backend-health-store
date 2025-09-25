import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { getUserWishlist, addToWishlist, removeFromWishlist, checkWishlistStatus, clearWishlist } from "../controllers/wishlistController.js";

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(isAuth);

// GET /api/wishlist - Dapatkan wishlist user
router.get("/", getUserWishlist);

// POST /api/wishlist - Tambah ke wishlist
router.post("/", addToWishlist);

// GET /api/wishlist/check/:productId - Cek status wishlist untuk produk
router.get("/check/:productId", checkWishlistStatus);

// DELETE /api/wishlist/:productId - Hapus dari wishlist
router.delete("/:productId", removeFromWishlist);

// DELETE /api/wishlist - Kosongkan wishlist
router.delete("/", clearWishlist);

export default router;
