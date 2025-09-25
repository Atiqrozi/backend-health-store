import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { sendMail } from "../utils/mailer.js";

// Vendor/admin update status pengiriman (pending → diproses → dikirim)
export const updateShipment = async (req, res) => {
  const { status, courier, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id).populate("userId");
  if (!order) return res.status(404).json({ message: "Order tidak ditemukan." });

  // Hanya vendor terkait atau admin yang boleh update
  if (req.user.role === "vendor" && !order.items.some((item) => String(item.vendorId) === String(req.user.vendorId))) {
    return res.status(403).json({ message: "Tidak boleh update order ini." });
  }

  order.orderStatus = status;
  if (status === "dikirim") {
    order.courier = courier;
    order.trackingNumber = trackingNumber;
    // Kirim email & notifikasi ke user
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
