import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";

// Advanced search with multiple filters
export const advancedSearch = async (req, res) => {
  try {
    const {
      q, // General search query
      category,
      brand,
      minPrice,
      maxPrice,
      location,
      prescriptionRequired,
      inStock,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 12,
      tags,
    } = req.query;

    // Build the search filter
    const filter = {};
    const pipeline = [];

    // Text search on product name and description
    if (q) {
      filter.$or = [{ name: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }, { tags: { $in: [new RegExp(q, "i")] } }];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Brand filter
    if (brand) {
      if (Array.isArray(brand)) {
        filter.brand = { $in: brand };
      } else {
        filter.brand = brand;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Prescription filter
    if (prescriptionRequired !== undefined) {
      filter.prescriptionRequired = prescriptionRequired === "true";
    }

    // Stock filter
    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Start building aggregation pipeline
    pipeline.push({ $match: filter });

    // Location-based search (search by vendor location)
    if (location) {
      pipeline.push({
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      });

      pipeline.push({
        $match: {
          "vendor.businessAddress": { $regex: location, $options: "i" },
        },
      });
    } else {
      // Always populate vendor info
      pipeline.push({
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor",
        },
      });
    }

    // Add sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    pipeline.push({ $sort: sortOptions });

    // Get total count for pagination
    const totalPipeline = [...pipeline];
    totalPipeline.push({ $count: "total" });
    const totalResult = await Product.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    // Add vendor user info
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "vendor.userId",
        foreignField: "_id",
        as: "vendorUser",
      },
    });

    // Project the final result
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        category: 1,
        brand: 1,
        price: 1,
        stock: 1,
        images: 1,
        rating: 1,
        reviewCount: 1,
        tags: 1,
        prescriptionRequired: 1,
        createdAt: 1,
        vendor: {
          $arrayElemAt: ["$vendor", 0],
        },
        vendorUser: {
          $arrayElemAt: ["$vendorUser", 0],
        },
      },
    });

    const products = await Product.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        q,
        category,
        brand,
        minPrice,
        maxPrice,
        location,
        prescriptionRequired,
        inStock,
        tags,
      },
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing search",
      error: error.message,
    });
  }
};

// Get search suggestions (autocomplete)
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q, type = "all" } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = [];

    if (type === "all" || type === "products") {
      // Product name suggestions
      const productNames = await Product.aggregate([
        {
          $match: {
            name: { $regex: q, $options: "i" },
          },
        },
        {
          $project: {
            name: 1,
            category: 1,
            brand: 1,
          },
        },
        { $limit: 5 },
      ]);

      suggestions.push(
        ...productNames.map((p) => ({
          type: "product",
          text: p.name,
          category: p.category,
          brand: p.brand,
        }))
      );
    }

    if (type === "all" || type === "categories") {
      // Category suggestions
      const categories = await Product.distinct("category", {
        category: { $regex: q, $options: "i" },
      });

      suggestions.push(
        ...categories.slice(0, 3).map((cat) => ({
          type: "category",
          text: cat,
        }))
      );
    }

    if (type === "all" || type === "brands") {
      // Brand suggestions
      const brands = await Product.distinct("brand", {
        brand: { $regex: q, $options: "i" },
      });

      suggestions.push(
        ...brands.slice(0, 3).map((brand) => ({
          type: "brand",
          text: brand,
        }))
      );
    }

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 10),
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting search suggestions",
      error: error.message,
    });
  }
};

// Get filter options (for dropdowns)
export const getFilterOptions = async (req, res) => {
  try {
    const [categories, brands, priceRange] = await Promise.all([
      // Get all categories
      Product.distinct("category"),

      // Get all brands
      Product.distinct("brand"),

      // Get price range
      Product.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
    ]);

    // Get locations from vendors
    const locations = await Vendor.distinct("businessAddress");

    // Extract cities/regions from addresses
    const cities = [
      ...new Set(
        locations
          .map((addr) => {
            // Simple extraction - you might want to improve this based on your address format
            const parts = addr.split(",");
            return parts.length > 1 ? parts[parts.length - 1].trim() : null;
          })
          .filter(Boolean)
      ),
    ];

    res.json({
      success: true,
      filters: {
        categories: categories.sort(),
        brands: brands.sort(),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
        locations: cities.sort(),
      },
    });
  } catch (error) {
    console.error("Get filter options error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting filter options",
      error: error.message,
    });
  }
};

// Get popular search terms
export const getPopularSearches = async (req, res) => {
  try {
    // Get most common product names and categories
    const popularProducts = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const popularBrands = await Product.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      popular: {
        categories: popularProducts.map((p) => p._id),
        brands: popularBrands.map((b) => b._id),
      },
    });
  } catch (error) {
    console.error("Get popular searches error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting popular searches",
      error: error.message,
    });
  }
};
