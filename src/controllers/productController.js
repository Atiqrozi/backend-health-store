import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { uploadToHealthStore } from "../utils/imagekit.js";

// List produk (query: kategori, vendor, search, pagination)
export const listProducts = async (req, res) => {
  const { category, vendor, search, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (vendor) filter.vendorId = vendor;
  if (search) filter.name = { $regex: search, $options: "i" };

  const products = await Product.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("vendorId", "storeName");
  res.json({ products });
};

// Detail produk
export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate("vendorId", "storeName");
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });
  res.json({ product });
};

// Create produk (admin/vendor)
export const createProduct = async (req, res) => {
  // Cek role vendor hanya boleh tambah produk untuk tokonya sendiri
  let vendorId = req.body.vendorId;
  if (req.user.role === "vendor") {
    const vendor = await Vendor.findOne({ userId: req.user._id, isApproved: true });
    if (!vendor) return res.status(403).json({ message: "Akun vendor belum disetujui." });
    vendorId = vendor._id;
  }

  // Upload gambar ke ImageKit jika ada
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const upload = await uploadToHealthStore(file.buffer, file.originalname);
      images.push(upload.url);
    }
  }

  const slug = req.body.name.toLowerCase().replace(/\s+/g, "-");
  const product = await Product.create({
    ...req.body,
    vendorId,
    slug,
    images,
  });
  res.status(201).json({ product });
};

// Update produk (admin/vendor, ownership check)
export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });

  // Hanya admin atau vendor pemilik produk yang boleh edit
  if (req.user.role === "vendor" && String(product.vendorId) !== String(req.user.vendorId)) {
    return res.status(403).json({ message: "Tidak boleh edit produk milik vendor lain." });
  }

  // Upload gambar baru jika ada
  let images = product.images;
  if (req.files && req.files.length > 0) {
    images = [];
    for (const file of req.files) {
      const upload = await uploadToHealthStore(file.buffer, file.originalname);
      images.push(upload.url);
    }
  }

  Object.assign(product, req.body, { images });
  await product.save();
  res.json({ product });
};

// Delete produk (admin/vendor, ownership check)
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });

  if (req.user.role === "vendor" && String(product.vendorId) !== String(req.user.vendorId)) {
    return res.status(403).json({ message: "Tidak boleh hapus produk milik vendor lain." });
  }

  await product.deleteOne();
  res.json({ message: "Produk dihapus." });
};
