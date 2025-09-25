import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { isVendor } from "../middlewares/role.js";
import { getVendorAnalytics, getVendorSalesReport } from "../controllers/vendorAnalyticsController.js";

const router = express.Router();

// All routes require vendor authentication
router.use(isAuth);
router.use(isVendor);

// GET /api/vendor-analytics - Enhanced vendor analytics dashboard
router.get("/", getVendorAnalytics);

// GET /api/vendor-analytics/sales-report - Detailed sales report
router.get("/sales-report", getVendorSalesReport);

export default router;
