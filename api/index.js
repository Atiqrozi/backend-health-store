import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Connect to database
connectDB();

// Export for Vercel serverless
export default app;