// utils/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Buat transporter untuk Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Fungsi kirim email
export const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Health Store" <${process.env.SMTP_USER}>`,
      to, // alamat penerima
      subject, // subjek email
      html, // isi email (bisa pakai HTML)
    });

    console.log("✅ Email terkirim: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Gagal mengirim email:", error);
    throw error;
  }
};

export default sendMail;
