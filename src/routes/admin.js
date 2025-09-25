import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/role.js";
import { overview, salesReport, listUsers, listVendors, getEnhancedAnalytics, getRevenueReports } from "../controllers/adminController.js";
const router = express.Router();

router.get("/overview", isAuth, isAdmin, overview);
router.get("/analytics", isAuth, isAdmin, getEnhancedAnalytics);
router.get("/revenue-reports", isAuth, isAdmin, getRevenueReports);
router.get("/reports", isAuth, isAdmin, salesReport);
router.get("/users", isAuth, isAdmin, listUsers);
router.get("/vendors", isAuth, isAdmin, listVendors);

export default router;
