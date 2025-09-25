import Notification from "../models/Notification.js";

// List notifikasi user
export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ notifications });
};

// Tandai notifikasi sudah dibaca
export const readNotification = async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif || String(notif.userId) !== String(req.user._id)) return res.status(404).json({ message: "Notifikasi tidak ditemukan." });
  notif.read = true;
  await notif.save();
  res.json({ notif });
};
