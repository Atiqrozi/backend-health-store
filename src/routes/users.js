import express from "express";
import { updateProfile, listUsers } from "../controllers/userController.js";
import { isAuth } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/role.js";
const router = express.Router();

router.get("/", isAuth, isAdmin, listUsers); // hanya admin
router.put("/me", isAuth, updateProfile);

export default router;
