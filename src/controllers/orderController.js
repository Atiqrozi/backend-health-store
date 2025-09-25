import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import Notification from "../models/Notification.js";
import { sendMail } from "../utils/mailer.js";

// Buat order (checkout)
export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // Hitung total dan update stok
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || product.stock < item.qty) {
      return res.status(400).json({ message: `Stok produk ${item.name} tidak cukup.` });
    }
    total += product.price * item.qty;
    product.stock -= item.qty;
    await product.save();
  }

  const order = await Order.create({
    userId: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    total,
    history: [{ status: "pending", timestamp: new Date() }],
  });

  res.status(201).json({ order });
};

// List order (admin: semua, vendor: order produk dia, user: order sendiri)
export const listOrders = async (req, res) => {
  let filter = {};
  if (req.user.role === "vendor") {
    // Cari order yang ada produk milik vendor ini
    const vendor = await Vendor.findOne({ userId: req.user._id });
    filter["items.vendorId"] = vendor._id;
  } else if (req.user.role === "user") {
    filter.userId = req.user._id;
  }
  const orders = await Order.find(filter).populate("userId", "name email");
  res.json({ orders });
};

// Detail order
export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("userId", "name email");
  if (!order) return res.status(404).json({ message: "Order tidak ditemukan." });

  // Vendor hanya boleh lihat order yang ada produk dia
  if (req.user.role === "vendor" && !order.items.some((item) => String(item.vendorId) === String(req.user.vendorId))) {
    return res.status(403).json({ message: "Tidak boleh akses order ini." });
  }
  // User hanya boleh lihat order sendiri
  if (req.user.role === "user" && String(order.userId._id) !== String(req.user._id)) {
    return res.status(403).json({ message: "Tidak boleh akses order ini." });
  }

  res.json({ order });
};

// Get orders by vendor ID
export const getOrdersByVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const orders = await Order.find({ "items.vendorId": vendorId }).populate("userId", "name email").sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error("Get orders by vendor error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil orders." });
  }
};

// Get orders by user ID
export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId }).populate("userId", "name email").sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error("Get orders by user error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil orders." });
  }
};

// Update status order (vendor/admin)
export const updateOrderStatus = async (req, res) => {
  const { status, courier, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id).populate("userId");
  if (!order) return res.status(404).json({ message: "Order tidak ditemukan." });

  // Vendor hanya boleh update order yang ada produk dia
  if (req.user.role === "vendor" && !order.items.some((item) => String(item.vendorId) === String(req.user.vendorId))) {
    return res.status(403).json({ message: "Tidak boleh update order ini." });
  }

  // Update status & tracking jika dikirim
  order.orderStatus = status;
  if (status === "dikirim") {
    order.courier = courier;
    order.trackingNumber = trackingNumber;
    // Kirim notifikasi email & in-app ke user
    await sendMail(order.userId.email, "Pesanan Anda Dikirim", `<p>Pesanan Anda telah dikirim via ${courier}, resi: ${trackingNumber}</p>`);
    await Notification.create({
      userId: order.userId._id,
      title: "Pesanan Dikirim",
      message: `Pesanan Anda telah dikirim via ${courier}, resi: ${trackingNumber}`,
      meta: { orderId: order._id },
    });
  }
  order.history.push({ status, timestamp: new Date() });
  await order.save();
  res.json({ order });
};
