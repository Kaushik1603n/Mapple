const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const bcrypt = require("bcrypt");
// const { log } = require("console");
const product = require("../../models/productSchema");
const order = require("../../models/orderSchema");
const Wallet = require("../../models/walletSchema");
const coupon = require("../../models/couponSchema");
const Offer = require("../../models/offerSchema");
const { default: mongoose } = require("mongoose");

const loadDashboard = async (req, res) => {
  try {
    // top 4 category and product

    // top 4 products
    const bestSellingProduct = await order.aggregate([
      {
        $unwind: "$orderedItem",
      },
      {
        $match: {
          "orderedItem.status": { $nin: ["Canceled", "Returned"] },
        },
      },
      {
        $group: {
          _id: "$orderedItem.product",
          totalCount: {
            $sum: 1,
          },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    const productIds = bestSellingProduct.map((product) => product._id);
    const topProductsDetails = await product.find({ _id: { $in: productIds } });

    const topProductsDetailsWithCount = topProductsDetails.map((product) => {
      const productCount = bestSellingProduct.find(
        (p) => p._id.toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        orderCount: productCount ? productCount.totalCount : 0,
      };
    });

    topProductsDetailsWithCount.sort((a, b) => b.orderCount - a.orderCount);

    // top 4 category
    const bestSellingProducts = await order.aggregate([
      {
        $unwind: "$orderedItem",
      },
      {
        $match: {
          "orderedItem.status": { $nin: ["Canceled", "Returned"] },
        },
      },
      {
        $group: {
          _id: "$orderedItem.product", // Group by product ID
          totalCount: { $sum: 1 },
        },
      },
      { $sort: { totalCount: -1 } }, // Sort by totalCount in descending order
    ]);

    const productId = bestSellingProducts.map((product) => product._id);

    // product details and their categories
    const productsWithCategories = await product
      .find({ _id: { $in: productId } })
      .populate("category");

    const categoryCounts = {};

    productsWithCategories.forEach((product) => {
      const categoryId = product.category._id.toString();
      if (!categoryCounts[categoryId]) {
        categoryCounts[categoryId] = {
          category: product.category,
          totalCount: 0,
        };
      }

      // Find the product in the bestSellingProducts and add its count to the category
      const productData = bestSellingProducts.find(
        (p) => p._id.toString() === product._id.toString()
      );
      if (productData) {
        categoryCounts[categoryId].totalCount += productData.totalCount;
      }
    });

    const sortedCategories = Object.values(categoryCounts).sort(
      (a, b) => b.totalCount - a.totalCount
    );

    // calculate total counts
    const totalProductCount = topProductsDetailsWithCount.reduce(
      (sum, product) => sum + product.orderCount,
      0
    );
    const totalCategoryCount = sortedCategories.reduce(
      (sum, category) => sum + category.totalCount,
      0
    );

    // Add percentage field
    const topProductsWithPercentage = topProductsDetailsWithCount.map(
      (product) => ({
        ...product,
        percentage: ((product.orderCount / totalProductCount) * 100).toFixed(2), // 2 decimal places
      })
    );

    const topCategoriesWithPercentage = sortedCategories.map((category) => ({
      ...category,
      percentage: ((category.totalCount / totalCategoryCount) * 100).toFixed(2),
    }));

    const topProducts = topProductsWithPercentage.slice(0, 4);
    const topCategories = topCategoriesWithPercentage.slice(0, 4);

    // Pass updated data to the template
    res.render("admin/dashboard", {
      top4Product: topProducts,
      top4Category: topCategories,
    });
  } catch (error) {
    console.log("Dashboard error:", error);
    res.redirect("/admin/pageerror");
  }
};

const salesData = async (req, res) => {
  const { filter } = req.query; // Get the filter (daily, weekly, monthly, or yearly)
  let pipeline = [];
  let result = filter || "monthly"; // Default to "monthly" if no filter is provided
  // console.log(result);

  try {
    if (result === "daily") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" }, // Extract the year
              dayOfYear: { $dayOfYear: "$createdAt" }, // Extract the day of the year
            },
            totalSales: { $sum: "$orderedItem.total" },
          },
        },
        {
          $match: {
            "_id.dayOfYear": { $lte: 365 }, // Filter valid day-of-year values
          },
        },
        {
          $sort: {
            "_id.year": 1, // Sort by year first
            "_id.dayOfYear": 1, // Then by day of the year
          },
        },
      ];
    } else if (result === "weekly") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" }, // Extract the year
              isoWeek: { $isoWeek: "$createdAt" }, // Extract the ISO week number
            },
            totalSales: { $sum: "$orderedItem.total" },
          },
        },
        {
          $sort: {
            "_id.year": 1, // Sort by year first
            "_id.isoWeek": 1, // Then by ISO week
          },
        },
      ];
    } else if (result === "monthly") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" }, // Extract year
              month: { $month: "$createdAt" }, // Extract month
            },
            totalSales: { $sum: "$orderedItem.total" },
          },
        },
        {
          $sort: {
            "_id.year": 1, // Sort by year
            "_id.month": 1, // Then by month
          },
        },
      ];
    } else if (result === "yearly") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            totalSales: { $sum: "$orderedItem.total" },
          },
        },
        { $sort: { _id: 1 } },
      ];
    }

    const salesData = await order.aggregate(pipeline);
    // console.log(salesData);

    res.json(salesData);
  } catch (err) {
    console.error("Error fetching sales data:", err);
    res.status(500).send("Internal Server Error");
  }
};

const discountDdata = async (req, res) => {
  const { filter } = req.query;
  let pipeline = [];
  let result = filter || "monthly";
  try {
    if (result === "daily") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              dayOfYear: { $dayOfYear: "$createdAt" },
            },
            totalDiscount: { $sum: "$discount" },
          },
        },
        {
          $match: {
            "_id.dayOfYear": { $lte: 365 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.dayOfYear": 1,
          },
        },
      ];
    } else if (result === "weekly") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              isoWeek: { $isoWeek: "$createdAt" },
            },
            totalDiscount: { $sum: "$discount" },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.isoWeek": 1,
          },
        },
      ];
    } else if (result === "monthly") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalDiscount: { $sum: "$discount" },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ];
    } else if (result === "yearly") {
      pipeline = [
        { $unwind: "$orderedItem" },
        {
          $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            totalDiscount: { $sum: "$discount" },
          },
        },
        { $sort: { _id: 1 } },
      ];
    }

    const salesData = await order.aggregate(pipeline);
    // console.log(salesData);

    res.json(salesData);
  } catch (err) {
    console.error("Error fetching sales data:", err);
    res.status(500).send("Internal Server Error");
  }
};

const ledgerData = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$orderedItem" },
      {
        $match: { "orderedItem.status": { $nin: ["Canceled", "Returned"] } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$orderedItem.total" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ];

    const ledgerData = await order.aggregate(pipeline);
    res.status(200).json(ledgerData);
  } catch (error) {
    console.error("Error generating ledger data:", error);
    res.status(500).json({ message: "Failed to generate ledger data." });
  }
};

module.exports={
    loadDashboard,
    salesData,
    discountDdata,
    ledgerData,
}