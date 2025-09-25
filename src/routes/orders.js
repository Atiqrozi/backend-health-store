import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { createOrder, listOrders, getOrder, updateOrderStatus, getOrdersByVendor, getOrdersByUser } from "../controllers/orderController.js";
const router = express.Router();

router.post("/", isAuth, createOrder);
router.get("/", isAuth, listOrders);
router.get("/vendor/:vendorId", isAuth, getOrdersByVendor); // Add endpoint for vendor orders
router.get("/user/:userId", isAuth, getOrdersByUser); // Add endpoint for user orders
router.get("/:id", isAuth, getOrder);
router.put("/:id/status", isAuth, updateOrderStatus);

export default router;
