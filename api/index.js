import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Cache connection to reuse across invocations
let isConnected = false;

// Handler function for Vercel
export default async function handler(req, res) {
  // Connect to database if not already connected
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection error:", error);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // Pass request to Express app
  return app(req, res);
}
