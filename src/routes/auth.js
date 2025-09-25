import express from "express";
import { register, login, logout, me, registerVendor } from "../controllers/authController.js";
import { isAuth } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
const router = express.Router();

router.post("/register", register);
router.post("/register-vendor", upload.array("documents", 5), registerVendor);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", isAuth, me);

export default router;
