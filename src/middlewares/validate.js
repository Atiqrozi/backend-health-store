import { validationResult } from "express-validator";

// Middleware untuk handle hasil validasi express-validator
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Kirim error validasi ke client
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
