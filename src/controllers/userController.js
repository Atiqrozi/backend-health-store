import User from "../models/User.js";

// Update profile user
export const updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true }).select("-passwordHash");
  res.json({ user });
};

// List semua user (khusus admin)
export const listUsers = async (req, res) => {
  const users = await User.find().select("-passwordHash");
  res.json({ users });
};
