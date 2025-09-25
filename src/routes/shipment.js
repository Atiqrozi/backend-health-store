import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { isVendor, isAdmin } from "../middlewares/role.js";
import { updateShipment } from "../controllers/shipmentController.js";
const router = express.Router();

router.put("/:id", isAuth, updateShipment); // vendor/admin

export default router;
