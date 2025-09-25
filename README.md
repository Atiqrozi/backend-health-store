# Health Store Backend API

Backend API untuk Health Store - E-commerce platform untuk produk kesehatan dengan sistem multi-vendor.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Token)
- **File Upload**: ImageKit
- **Email Service**: Nodemailer (Gmail SMTP)
- **Payment**: Stripe (Mock)
- **Deployment**: Vercel Serverless

## 📁 Project Structure

```
src/
├── controllers/     # Business logic controllers
├── middlewares/     # Auth, validation, error handling
├── models/          # MongoDB Mongoose schemas
├── routes/          # API route definitions
├── utils/           # Utility functions (email, imagekit)
├── config/          # Database configuration
├── app.js           # Express app setup
└── server.js        # Server entry point
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- ImageKit account (for file uploads)
- Gmail account (for SMTP)

### Setup Instructions

1. **Clone repository:**

   ```bash
   git clone https://github.com/your-username/health-store-backend.git
   cd health-store-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**

   ```bash
   cp .env.example .env
   ```

4. **Update `.env` with your credentials:**

   - MongoDB Atlas connection string
   - JWT secrets (generate random strings)
   - ImageKit credentials
   - Gmail SMTP credentials

5. **Start development server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

Server akan berjalan di `http://localhost:5000`

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/register-vendor` - Vendor registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Vendors

- `GET /api/vendors` - List all vendors (Admin only)
- `GET /api/vendors/profile/me` - Get current vendor profile
- `GET /api/vendors/:id` - Get vendor by ID
- `POST /api/vendors/apply` - Apply as vendor
- `PUT /api/vendors/:id/approve` - Approve vendor (Admin only)

### Products

- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Vendor only)
- `PUT /api/products/:id` - Update product (Vendor only)
- `DELETE /api/products/:id` - Delete product (Vendor only)

### Orders

- `GET /api/orders` - List orders (filtered by role)
- `GET /api/orders/vendor/:vendorId` - Get orders by vendor
- `GET /api/orders/user/:userId` - Get orders by user
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

### Users & Admin

- `GET /api/users` - List users (Admin only)
- `GET /api/admin/stats` - Admin dashboard statistics
- `GET /api/notifications` - Get notifications
- `POST /api/payments/mock` - Mock payment processing

## 🔐 Authentication & Authorization

### Roles

- **Admin**: Full system access
- **Vendor**: Manage own products and orders
- **User**: Browse products, place orders

### JWT Implementation

- Access token stored in localStorage (frontend)
- HTTP-only cookies for additional security
- Token validation middleware for protected routes

## 🌍 Environment Variables

Required environment variables (see `.env.example`):

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-endpoint
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## 🚀 Deployment to Vercel

### Prerequisites

- GitHub account
- Vercel account connected to GitHub

### Deployment Steps

1. **Push to GitHub:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/health-store-backend.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**

   - Import project from GitHub on Vercel dashboard
   - Set framework preset to "Other"
   - Add all environment variables from `.env`
   - Deploy

3. **Post-deployment:**
   - Update CORS origins in `app.js` with production URLs
   - Test all API endpoints
   - Monitor logs for any issues

## 📝 API Documentation

### Response Format

All API responses follow this format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}, // Response data (if any)
  "errors": {} // Validation errors (if any)
}
```

### Error Handling

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Rate limiting (200 requests per 15 minutes)
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- Environment variable protection

## 📧 Contact & Support

**Developer**: AtiqRozi  
**Email**: atiqrozi14@gmail.com  
**Repository**: [GitHub Repository URL]

## 📄 License

This project is licensed under the MIT License.
