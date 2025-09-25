import ImageKit from "imagekit";
import dotenv from "dotenv";

// Load environment variables dulu sebelum init ImageKit
dotenv.config();


const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Fungsi upload ke folder 'health-store'
export const uploadToHealthStore = async (fileBuffer, fileName) => {
  try {
    return await imagekit.upload({
      file: fileBuffer, // Buffer atau base64 string
      fileName,
      folder: "/health-store", // Folder tujuan di ImageKit
    });
  } catch (error) {
    console.error("❌ ImageKit upload error:", error);
    throw error;
  }
};

export default imagekit;
