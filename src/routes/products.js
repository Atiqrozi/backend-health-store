import express from "express";
import upload from "../middlewares/upload.js";
import { isAuth } from "../middlewares/auth.js";
import { isAdmin, isVendor } from "../middlewares/role.js";
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", isAuth, upload.array("images"), createProduct); // admin/vendor
router.put("/:id", isAuth, upload.array("images"), updateProduct); // admin/vendor
router.delete("/:id", isAuth, deleteProduct); // admin/vendor

export default router;
