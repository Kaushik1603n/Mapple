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

const pageerror = (req, res) => {
  res.render("pageerror");
};

const loadLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { message: null });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("admin/login", {
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("admin not found");

      return res.render("admin/login", {
        message: "Admin not found. Check your email.",
      });
    }

    if (!admin.isAdmin) {
      console.log("Access denied: User is not an admin");
      return res.render("admin/login", {
        message: "Access denied. You are not an admin.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (passwordMatch) {
      req.session.admin = true;
      return res.redirect("/admin/dashboard");
    } else {
      return res.render("admin/login", { message: "Incorrect password." });
    }
  } catch (error) {
    console.log("Login error:", error);
    return res.render("admin/login", {
      message: "An error occurred. Please try again later.",
    });
  }
};


const loadproducts = async (req, res) => {
  try {
    res.render("admin/products");
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};
const loadAddProducts = async (req, res) => {
  try {
    res.render("admin/addProduct");
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};


const loadSales = async (req, res) => {
  try {
    const customers = await User.find().countDocuments();
    const orders = await order.find({}).countDocuments();
    const discount = await order.aggregate([
      {
        $unwind: "$orderedItem", // Unwind the orderedItem array
      },
      {
        $match: {
          // Match the filter and date conditions
          "orderedItem.status": "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: "$discount" },
        },
      },
    ]);
    const totalDiscount = discount.length > 0 ? discount[0].totalDiscount : 0;
    // console.log(totalDiscount);

    res.render("admin/sales", { customers, orders, totalDiscount });
  } catch (error) {}
};

const salesReport = async (req, res) => {
  const { range, filter, startDate, endDate } = req.body;
  console.log(req.body);

  let query = { "$orderedItem.status": filter };

  // Add date range condition based on the range
  if (range === "Today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.date = { $gte: today };
  } else if (range === "Week") {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    query.date = { $gte: lastWeek };
  } else if (range === "Month") {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    query.date = { $gte: lastMonth };
  } else if (range === "Custom") {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  console.log(query);

  // const result = await order.find(query);
  const result = await order.aggregate([
    {
      $unwind: "$orderedItem", // Unwind the orderedItem array
    },
    {
      $match: {
        // Match the filter and date conditions
        "orderedItem.status": filter,
        createdAt: query.date || {},
      },
    },
  ]);

  // console.log(result);
  res.json(result);

  // Fetch data from the database
  //  order.find(query).toArray((err, results) => {
  //     if (err) {
  //         res.status(500).send("Error fetching sales report");
  //     } else {
  //       console.log(results);

  //         res.json(results);
  //     }
  // });
};

const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session", err);
        return res.redirect("/admin/pageerror");
      }
      res.redirect("/admin/login");
    });
  } catch (error) {
    console.log("unexpected error during logout");
    res.redirect("/admin/pageerror");
  }
};

module.exports = {
  loadLogin,
  login,

  loadproducts,
  loadAddProducts,

  pageerror,
  logout,

  loadSales,
  salesReport,
};
