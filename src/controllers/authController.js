import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import { uploadToHealthStore } from "../utils/imagekit.js";

// Helper untuk generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register user biasa
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email sudah terdaftar." });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: role || "user" });

  // Generate token & set cookie
  const token = generateToken(user);
  res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
};

// Register vendor (user + vendor application sekaligus)
export const registerVendor = async (req, res) => {
  try {
    const { name, email, password, phone, storeName, businessAddress, description } = req.body;

    // Cek apakah email sudah terdaftar
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email sudah terdaftar." });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Buat user dengan role 'user' dulu (akan diupdate jadi vendor setelah approved)
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: "user", // Tetap user sampai vendor diapprove
    });

    // Upload dokumen jika ada
    const documents = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const upload = await uploadToHealthStore(file.buffer, file.originalname);
          documents.push(upload.url);
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          // Lanjutkan tanpa menggagalkan seluruh proses
        }
      }
    }

    // Buat vendor application
    const vendor = await Vendor.create({
      userId: user._id,
      storeName,
      businessAddress,
      description,
      documents,
      isApproved: false, // Menunggu approval admin
    });

    // Generate token & set cookie
    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    res.status(201).json({
      message: "Registrasi vendor berhasil! Menunggu persetujuan admin.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      vendor: {
        id: vendor._id,
        storeName: vendor.storeName,
        isApproved: vendor.isApproved,
      },
      token,
    });
  } catch (error) {
    console.error("Register vendor error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat registrasi vendor." });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email tidak ditemukan." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Password salah." });

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    // Prepare user response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // If user is a vendor OR if user has vendor application, fetch vendor data
    const vendor = await Vendor.findOne({ userId: user._id });
    if (vendor) {
      userResponse.vendor = {
        id: vendor._id,
        userId: vendor.userId,
        storeName: vendor.storeName,
        businessAddress: vendor.businessAddress,
        description: vendor.description,
        documents: vendor.documents,
        isApproved: vendor.isApproved,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      };

      // If vendor is approved but user role is not vendor, update it
      if (vendor.isApproved && user.role !== "vendor") {
        await User.findByIdAndUpdate(user._id, { role: "vendor" });
        userResponse.role = "vendor";
      }
    }

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat login." });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout berhasil." });
};

// Get profile (me)
export const me = async (req, res) => {
  res.json({ user: req.user });
};
