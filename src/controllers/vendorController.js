import Vendor from "../models/Vendor.js";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";
import { uploadToHealthStore } from "../utils/imagekit.js";

// Vendor apply (daftar vendor)
export const applyVendor = async (req, res) => {
  const { storeName, businessAddress, description } = req.body;
  const documents = req.files ? req.files.map((f) => f.url) : [];
  const exists = await Vendor.findOne({ userId: req.user._id });
  if (exists) return res.status(400).json({ message: "Sudah pernah daftar vendor." });

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const upload = await uploadToHealthStore(file.buffer, file.originalname);
      documents.push(upload.url);
    }
  }

  const vendor = await Vendor.create({
    userId: req.user._id,
    storeName,
    businessAddress,
    description,
    documents,
    isApproved: false,
  });
  res.json({ vendor });
};

// List vendor (admin)
export const listVendors = async (req, res) => {
  const vendors = await Vendor.find().populate("userId", "name email");
  res.json({ vendors });
};

// Approve vendor (admin)
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate("userId");
    if (!vendor) return res.status(404).json({ message: "Vendor tidak ditemukan." });

    // Approve vendor
    vendor.isApproved = true;
    await vendor.save();

    // Update user role menjadi vendor
    await User.findByIdAndUpdate(vendor.userId._id, { role: "vendor" });

    // Kirim email notifikasi ke vendor
    try {
      await sendMail(vendor.userId.email, "Akun Vendor Anda Disetujui", `<p>Selamat, akun vendor Anda (${vendor.storeName}) telah disetujui oleh admin. Anda sekarang dapat login sebagai vendor.</p>`);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Lanjutkan meskipun email gagal dikirim
    }

    res.json({
      message: "Vendor berhasil disetujui",
      vendor: {
        ...vendor.toObject(),
        userId: {
          ...vendor.userId.toObject(),
          role: "vendor",
        },
      },
    });
  } catch (error) {
    console.error("Approve vendor error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat menyetujui vendor." });
  }
};

// Get vendor by id (public)
export const getVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).populate("userId", "name email");
  if (!vendor) return res.status(404).json({ message: "Vendor tidak ditemukan." });
  res.json({ vendor });
};

// Get current vendor profile (for logged in vendor)
export const getMyVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) return res.status(404).json({ message: "Vendor profile tidak ditemukan." });

    res.json(vendor);
  } catch (error) {
    console.error("Get vendor profile error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil profile vendor." });
  }
};
