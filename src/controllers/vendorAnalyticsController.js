import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";

// Enhanced vendor analytics dashboard
export const getVendorAnalytics = async (req, res) => {
  try {
    // Find vendor by user ID
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor tidak ditemukan." });
    }

    // Date ranges for analytics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Sales Analytics
    const [totalRevenue, monthlyRevenue, lastMonthRevenue, yearlyRevenue, totalOrders, monthlyOrders, pendingOrders, completedOrders] = await Promise.all([
      // Total revenue (all time)
      Order.aggregate([{ $unwind: "$items" }, { $match: { "items.vendorId": vendor._id, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } }]),

      // Monthly revenue
      Order.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.vendorId": vendor._id,
            paymentStatus: "paid",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      ]),

      // Last month revenue
      Order.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.vendorId": vendor._id,
            paymentStatus: "paid",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      ]),

      // Yearly revenue
      Order.aggregate([
        { $unwind: "$items" },
        {
          $match: {
            "items.vendorId": vendor._id,
            paymentStatus: "paid",
            createdAt: { $gte: startOfYear },
          },
        },
        { $group: { _id: null, total: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      ]),

      // Total orders
      Order.countDocuments({
        "items.vendorId": vendor._id,
      }),

      // Monthly orders
      Order.countDocuments({
        "items.vendorId": vendor._id,
        createdAt: { $gte: startOfMonth },
      }),

      // Pending orders
      Order.countDocuments({
        "items.vendorId": vendor._id,
        status: "pending",
      }),

      // Completed orders
      Order.countDocuments({
        "items.vendorId": vendor._id,
        status: "completed",
      }),
    ]);

    // Product Performance Metrics
    const [productsSold, topProducts, lowStockProducts] = await Promise.all([
      // Products sold (total quantity)
      Order.aggregate([{ $unwind: "$items" }, { $match: { "items.vendorId": vendor._id, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$items.qty" } } }]),

      // Top selling products
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.vendorId": vendor._id, paymentStatus: "paid" } },
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
      ]),

      // Low stock products
      Product.find({
        vendorId: vendor._id,
        stock: { $lte: 10 },
        isActive: true,
      })
        .select("name stock price")
        .limit(10),
    ]);

    // Revenue Trends (last 12 months)
    const revenueTrends = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.vendorId": vendor._id,
          paymentStatus: "paid",
          createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Customer Insights
    const [topCustomers, customerStats] = await Promise.all([
      // Top customers by order value
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.vendorId": vendor._id, paymentStatus: "paid" } },
        {
          $group: {
            _id: "$userId",
            totalSpent: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
      ]),

      // Customer statistics
      Order.aggregate([{ $unwind: "$items" }, { $match: { "items.vendorId": vendor._id } }, { $group: { _id: "$userId" } }, { $count: "uniqueCustomers" }]),
    ]);

    // Calculate growth rates
    const currentRevenue = monthlyRevenue[0]?.total || 0;
    const lastRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    res.json({
      // Sales Analytics
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: currentRevenue,
        yearly: yearlyRevenue[0]?.total || 0,
        growth: revenueGrowth,
      },

      // Order Statistics
      orders: {
        total: totalOrders,
        monthly: monthlyOrders,
        pending: pendingOrders,
        completed: completedOrders,
      },

      // Product Performance
      products: {
        totalSold: productsSold[0]?.total || 0,
        topSelling: topProducts,
        lowStock: lowStockProducts,
        totalProducts: await Product.countDocuments({ vendorId: vendor._id }),
      },

      // Revenue Trends
      trends: revenueTrends,

      // Customer Insights
      customers: {
        total: customerStats[0]?.uniqueCustomers || 0,
        topCustomers: topCustomers,
      },
    });
  } catch (err) {
    console.error("Get vendor analytics error:", err);
    res.status(500).json({ message: "Gagal mengambil data analytics." });
  }
};

// Get vendor sales report with date range
export const getVendorSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period = "daily" } = req.query;

    // Find vendor
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor tidak ditemukan." });
    }

    // Date filters
    let matchCondition = {
      "items.vendorId": vendor._id,
      paymentStatus: "paid",
    };

    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Group by period
    let groupBy;
    switch (period) {
      case "monthly":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
      case "weekly":
        groupBy = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      default: // daily
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
    }

    const salesReport = await Order.aggregate([
      { $unwind: "$items" },
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          orders: { $sum: 1 },
          itemsSold: { $sum: "$items.qty" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({ salesReport });
  } catch (err) {
    console.error("Get vendor sales report error:", err);
    res.status(500).json({ message: "Gagal mengambil laporan penjualan." });
  }
};
