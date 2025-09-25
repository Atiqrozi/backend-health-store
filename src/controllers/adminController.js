import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Dashboard ringkasan statistik
export const overview = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const totalVendors = await Vendor.countDocuments();
  const vendorsAwaiting = await Vendor.countDocuments({ isApproved: false });
  const totalSales = await Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]);
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

  res.json({
    totalUsers,
    totalVendors,
    vendorsAwaiting,
    totalSales: totalSales[0]?.total || 0,
    recentOrders,
  });
};

// Enhanced admin analytics dashboard
export const getEnhancedAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // System-wide Revenue Analytics
    const [totalRevenue, monthlyRevenue, lastMonthRevenue, yearlyRevenue, dailyRevenue] = await Promise.all([
      // Total revenue
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),

      // Monthly revenue
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Last month revenue
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Yearly revenue
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfYear },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Daily revenue (last 30 days)
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: last30Days },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),
    ]);

    // User Activity Analytics
    const [totalUsers, activeUsers, newUsersThisMonth, userGrowth] = await Promise.all([
      User.countDocuments({ role: "user" }),

      // Active users (users with orders in last 30 days)
      Order.aggregate([{ $match: { createdAt: { $gte: last30Days } } }, { $group: { _id: "$userId" } }, { $count: "activeUsers" }]),

      // New users this month
      User.countDocuments({
        role: "user",
        createdAt: { $gte: startOfMonth },
      }),

      // User growth trend (last 12 months)
      User.aggregate([
        {
          $match: {
            role: "user",
            createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Popular Products Analysis
    const [popularProducts, categoryPerformance] = await Promise.all([
      // Top selling products
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $lookup: {
            from: "vendors",
            localField: "productInfo.vendorId",
            foreignField: "_id",
            as: "vendorInfo",
          },
        },
        { $unwind: "$vendorInfo" },
      ]),

      // Category performance
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { paymentStatus: "paid" } },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $group: {
            _id: "$productInfo.category",
            totalSold: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    // Vendor Performance
    const [topVendors, vendorStats] = await Promise.all([
      // Top vendors by revenue
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$items.vendorId",
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            totalOrders: { $sum: 1 },
            totalProducts: { $sum: "$items.qty" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "vendors",
            localField: "_id",
            foreignField: "_id",
            as: "vendorInfo",
          },
        },
        { $unwind: "$vendorInfo" },
      ]),

      // Vendor statistics
      {
        total: await Vendor.countDocuments(),
        approved: await Vendor.countDocuments({ isApproved: true }),
        pending: await Vendor.countDocuments({ isApproved: false }),
      },
    ]);

    // System Health Metrics
    const systemHealth = {
      totalProducts: await Product.countDocuments(),
      activeProducts: await Product.countDocuments({ isActive: true }),
      lowStockProducts: await Product.countDocuments({ stock: { $lte: 10 }, isActive: true }),
      totalOrders: await Order.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: "pending" }),
      completedOrders: await Order.countDocuments({ status: "completed" }),
    };

    // Calculate growth rates
    const currentRevenue = monthlyRevenue[0]?.total || 0;
    const lastRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    res.json({
      // Revenue Analytics
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: currentRevenue,
        yearly: yearlyRevenue[0]?.total || 0,
        growth: revenueGrowth,
        dailyTrends: dailyRevenue,
      },

      // User Analytics
      users: {
        total: totalUsers,
        active: activeUsers[0]?.activeUsers || 0,
        newThisMonth: newUsersThisMonth,
        growthTrend: userGrowth,
      },

      // Product Analytics
      products: {
        popular: popularProducts,
        categories: categoryPerformance,
      },

      // Vendor Analytics
      vendors: {
        stats: vendorStats,
        topPerformers: topVendors,
      },

      // System Health
      systemHealth,
    });
  } catch (err) {
    console.error("Get enhanced analytics error:", err);
    res.status(500).json({ message: "Gagal mengambil data analytics." });
  }
};

// Get comprehensive revenue reports
export const getRevenueReports = async (req, res) => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;

    let matchCondition = { paymentStatus: "paid" };

    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Group by period
    let groupBy;
    switch (period) {
      case "yearly":
        groupBy = { year: { $year: "$createdAt" } };
        break;
      case "daily":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      default: // monthly
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
    }

    const revenueReport = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: "$total" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({ revenueReport });
  } catch (err) {
    console.error("Get revenue reports error:", err);
    res.status(500).json({ message: "Gagal mengambil laporan revenue." });
  }
};

// Laporan penjualan (total transaksi, produk terjual, vendor teraktif)
export const salesReport = async (req, res) => {
  // Total transaksi & produk terjual
  const totalTransactions = await Order.countDocuments({ paymentStatus: "paid" });
  const productsSold = await Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $unwind: "$items" }, { $group: { _id: null, total: { $sum: "$items.qty" } } }]);
  // Vendor teraktif (paling banyak order)
  const activeVendors = await Order.aggregate([{ $unwind: "$items" }, { $group: { _id: "$items.vendorId", count: { $sum: "$items.qty" } } }, { $sort: { count: -1 } }, { $limit: 3 }]);
  const vendorDetails = await Vendor.find({ _id: { $in: activeVendors.map((v) => v._id) } });

  res.json({
    totalTransactions,
    productsSold: productsSold[0]?.total || 0,
    activeVendors: activeVendors.map((v) => ({
      vendor: vendorDetails.find((d) => String(d._id) === String(v._id)),
      sold: v.count,
    })),
  });
};

// List semua user
export const listUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-passwordHash");
  res.json({ users });
};

// List semua vendor
export const listVendors = async (req, res) => {
  const vendors = await Vendor.find().populate("userId", "name email");
  res.json({ vendors });
};
