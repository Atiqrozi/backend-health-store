import multer from "multer";

// Konfigurasi multer untuk upload file ke memory (buffer, cocok untuk upload ke ImageKit)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and PDFs
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar (JPG, PNG) dan PDF yang diperbolehkan!"), false);
    }
  },
});

export { upload };
export default upload;
