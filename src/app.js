import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import vendorRoutes from "./routes/vendors.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import shipmentRoutes from "./routes/shipment.js";
import wishlistRoutes from "./routes/wishlist.js";
import vendorAnalyticsRoutes from "./routes/vendorAnalytics.js";
import searchRoutes from "./routes/search.js";

dotenv.config();

const app = express();

// Connect to database for serverless
connectDB().catch(console.error);

// 1. Parsing body & cookie
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. Keamanan
app.use(helmet());

// 3. CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://frontend-health-store.vercel.app", // Frontend production URL
      "https://frontend-health-store-*.vercel.app", // Preview deployments
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 4. Logging
app.use(morgan("dev"));

// 5. Rate limiter (opsional)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Terlalu banyak permintaan, coba lagi nanti.",
  })
);

// 6. Routing utama
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shipment", shipmentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/vendor-analytics", vendorAnalyticsRoutes);
app.use("/api/search", searchRoutes);

// 7. 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// 8. Error handler global
app.use(errorHandler);

export default app;
