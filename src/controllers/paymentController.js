import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

// Simulasi pembayaran (dummy/mock)
export const mockPayment = async (req, res) => {
  const { orderId, method, amount } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order tidak ditemukan." });

  // Tandai payment sukses
  const payment = await Payment.create({
    orderId,
    method,
    amount,
    status: "paid",
    transactionId: "MOCK-" + Date.now(),
  });
  order.paymentStatus = "paid";
  await order.save();

  res.json({ payment });
};

// Admin update status pembayaran (diterima/ditolak)
export const updatePaymentStatus = async (req, res) => {
  const { status } = req.body;
  const payment = await Payment.findById(req.params.id).populate("orderId");
  if (!payment) return res.status(404).json({ message: "Payment tidak ditemukan." });

  payment.status = status;
  await payment.save();

  // Update status order juga
  if (payment.orderId) {
    payment.orderId.paymentStatus = status;
    await payment.orderId.save();
  }

  res.json({ payment });
};
