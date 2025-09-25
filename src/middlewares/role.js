// Middleware untuk cek role admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Akses khusus admin." });
};

// Middleware untuk cek role vendor
export const isVendor = (req, res, next) => {
  if (req.user && req.user.role === "vendor") return next();
  return res.status(403).json({ message: "Akses khusus vendor." });
};

// Middleware untuk cek role user (pembeli)
export const isUser = (req, res, next) => {
  if (req.user && req.user.role === "user") return next();
  return res.status(403).json({ message: "Akses khusus user." });
};
