import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware untuk autentikasi JWT (wajib login)
export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Akses ditolak. Silakan login." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-passwordHash");
    if (!req.user) return res.status(401).json({ message: "User tidak ditemukan." });

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau expired." });
  }
};
