import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/role.js";
import { mockPayment, updatePaymentStatus } from "../controllers/paymentController.js";
const router = express.Router();

router.post("/mock", isAuth, mockPayment);
router.put("/:id/status", isAuth, isAdmin, updatePaymentStatus);

export default router;
