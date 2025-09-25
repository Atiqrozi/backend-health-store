import express from "express";
import upload from "../middlewares/upload.js";
import { isAuth } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/role.js";
import { applyVendor, listVendors, approveVendor, getVendor, getMyVendorProfile } from "../controllers/vendorController.js";
const router = express.Router();

router.post("/apply", isAuth, upload.array("documents"), applyVendor);
router.get("/", isAuth, isAdmin, listVendors);
router.get("/profile/me", isAuth, getMyVendorProfile); // Changed to avoid conflict with /:id
router.put("/:id/approve", isAuth, isAdmin, approveVendor);
router.get("/:id", getVendor); // This should be last to avoid conflicts

export default router;
