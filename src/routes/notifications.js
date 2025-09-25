import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { listNotifications, readNotification } from "../controllers/notificationController.js";
const router = express.Router();

router.get("/", isAuth, listNotifications);
router.put("/:id/read", isAuth, readNotification);

export default router;
