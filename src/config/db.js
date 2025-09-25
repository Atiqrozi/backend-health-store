import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Prevent multiple connections in serverless environment
    if (mongoose.connection.readyState === 0) {
      const options = {
        bufferCommands: false,
        maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log("MongoDB Connected");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err; // Throw error instead of process.exit for serverless
  }
};

export default connectDB;
