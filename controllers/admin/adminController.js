const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const bcrypt = require("bcrypt");
const { log } = require("console");
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

const discountDdata = async (req,res)=>{
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
}

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



const loadCustomer = async (req, res) => {
  try {
    const seccess = req.session.successMessage || null;
    req.session.successMessage = null;
    const searchQuery = req.query.search || "";
    const isBlockFilter = req.query.isBlock || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const query = {
      $and: [
        {
          $or: [
            { name: new RegExp(searchQuery, "i") },
            { email: new RegExp(searchQuery, "i") },
          ],
        },
      ],
    };

    if (isBlockFilter) {
      query.$and.push({ isBlock: isBlockFilter === "true" });
    }

    const totalCustomers = await User.countDocuments(query);
    const user = await User.find(query).skip(skip).limit(limit);

    const totalPages = Math.ceil(totalCustomers / limit);

    res.render("admin/customer", {
      user,
      searchQuery,
      isBlockFilter,
      totalPages,
      totalCustomers,
      currentPage: page,
      seccess,
    });
  } catch (error) {
    console.log("Dashboard error:", error);
    res.redirect("/admin/pageerror");
  }
};

const updateCustomerStatus = async (req, res) => {
  const { userId } = req.params;
  const { isBlock } = req.body;

  try {
    const result = await User.findByIdAndUpdate(
      userId,
      { isBlock: Boolean(isBlock) },
      { new: true }
    );

    if (result) {
      return res
        .status(200)
        .json({ success: true, message: "User status updated successfully." });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating user status.",
    });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await User.findOneAndDelete({ _id: id });
    // console.log(result);

    if (result) {
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully." });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user.",
    });
  }
};
const loadAddCustomer = async (req, res) => {
  try {
    const seccess = req.session.successMessage || null;
    req.session.successMessage = null;
    res.render("admin/addCustomer", { seccess });
  } catch (error) {}
};

const securePassword = async (password) => {
  try {
    if (!password) {
      throw new Error("Password is empty or invalid.");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error("Error in securePassword:", error);
    throw error;
  }
};

const addCustomer = async (req, res) => {
  try {
    const { name, email, secondaryEmail, phone, status, password } = req.body;

    if (!name || !email) {
      return res.render("admin/addCustomer", {
        message: "Name and Email are required.",
      });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("admin/addCustomer", {
        message: "Customer already exists.",
      });
    }

    const passwordHash = password ? await securePassword(password) : null;

    const isBlock = status === "true";

    const saveUserData = new User({
      name,
      email,
      secondaryEmail,
      phone,
      isBlock,
      password: passwordHash,
    });

    await saveUserData.save();

    req.session.successMessage = "Customer added successfully!";
    return res.redirect("/admin/addCustomer");
  } catch (error) {
    console.error("addCustomer error:", error);

    return res.status(500).render("admin/pageerror", {
      error: "Internal Server Error",
    });
  }
};

const loadUpdateCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.find({ _id: id });

    if (user) {
      return res.render("admin/updateCustomer", { user });
    }
  } catch (error) {}
};
const loadUpdateCustomerPage = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.find({ _id: id });
    const success = req.session.successMessage || null;
    const message = req.session.errorMessage || null;

    req.session.successMessage = null;
    req.session.errorMessage = null;

    res.render("admin/updateCustomerPage", { success, message, user });
  } catch (error) {
    console.error("Error loading the update customer page:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateCustomer = async (req, res) => {
  const { _id, name, email, secondaryEmail, phone, status, password } =
    req.body;
  try {
    const findUser = await User.findOne({ _id });

    if (!findUser) {
      return res.redirect("/admin/customer");
    }

    const passwordHash = password
      ? await securePassword(password)
      : findUser.password;

    const isBlock = status === "true";
    const result = await User.updateOne(
      { _id: _id },
      {
        $set: {
          name: name,
          email: email,
          secondaryEmail: secondaryEmail,
          phone: phone,
          isBlock: isBlock,
          password: passwordHash,
        },
      }
    );
    req.session.successMessage = "Customer updated successfully.";
    return res.redirect(`/admin/updateCustomerDetails/${_id}`);
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    req.session.errorMessage = "Something went wrong. Please try again.";
    return res.redirect(`/admin/updateCustomerDetails/${_id}`);
  }
};

const loadcategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({})
      .sort({ createAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    const successMessage = req.session.successMessage || null;
    req.session.successMessage = null;

    res.render("admin/category", {
      category: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
      success: successMessage,
    });
  } catch (error) {
    console.log("category error:", error);
    res.redirect("/admin/pageerror");
  }
};

const loadAddCategory = async (req, res) => {
  try {
    const successMessage = req.session.successMessage || null;
    req.session.successMessage = null;
    res.render("admin/addCategory", { success: successMessage });
  } catch (error) {
    console.log("addCategory error:", error);
    res.redirect("/admin/pageerror");
  }
};

const addCategory = async (req, res) => {
  try {
    const { category, description, categoryStatus } = req.body;

    const trimmedName = category.trim();
    const nameExists = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (nameExists) {
      return res.render("admin/addCategory", {
        message: "The category already exists",
      });
    }

    const booleanValue = categoryStatus === "list";
    const newCategory = new Category({
      name: trimmedName,
      description,
      status: booleanValue,
    });

    await newCategory.save();

    req.session.successMessage = "Category added successfully!";
    return res.redirect("/admin/addCategory");
  } catch (error) {
    console.error("addCategory error:", error);
    return res.status(500).render("admin/pageerror", {
      error: "Internal server Error",
    });
  }
};

const loadEditCategory = async (req, res) => {
  const { id } = req.params;
  //   console.log(id);
  try {
    const category = await Category.find({ _id: id });
    res.render("admin/editCategory", { category });
  } catch (error) {
    console.log("Edit Category error:", error);
    res.redirect("/admin/pageerror");
  }
};

const editCategory = async (req, res) => {
  try {
    const { category, description, categoryStatus } = req.body;

    const trimmedName = category.trim();
    const nameExists = await Category.findOne({ name: trimmedName });

    const booleanValue = categoryStatus === "list";
    const result = await Category.updateOne(
      { _id: req.body.id },
      { name: trimmedName, description, status: booleanValue }
    );

    if (result) {
      req.session.successMessage = "Category updated successfully!";
      return res.redirect("/admin/category");
    }
  } catch (error) {
    console.error("editCategory error:", error);
    return res.status(500).render("admin/pageerror", {
      error: "Internal Server Error",
    });
  }
};

const editCategoryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await Category.updateOne({ _id: id }, { status });
    res.status(200).json({
      success: true,
      message: "Catagory status updated successfully.",
    });
  } catch (error) {
    console.error("Error updating category status:", error);
    res.json({ success: false, message: "Failed to update category status." });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  //   console.log(id);

  try {
    const result = await Category.findOneAndDelete({ _id: id });
    // console.log(result);

    if (result) {
      res.status(200).json({
        success: true,
        message: "Category deleted successfully.",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the category.",
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

const loadOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    const totalOrders = await order.countDocuments();

    const orders = await order.aggregate([
      { $unwind: "$orderedItem" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.render("admin/orders", {
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};

const loadViewOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);

    const findOrder = await order.aggregate([
      {
        $unwind: "$orderedItem",
      },
      {
        $match: {
          "orderedItem._id": objectId,
        },
      },
    ]);
    // console.log(findOrder);

    if (!findOrder) {
      return res.status(400).json("order not fount");
    }

    res.render("admin/orderDetails", { orderDetails: findOrder });
  } catch (error) {
    console.log(error);
  }
};

const loadCancelReturn = async (req, res) => {
  try {
    const orders = await order.aggregate([
      {
        $match: {
          "orderedItem.status": { $in: ["Return Request", "Cancel Request"] },
        },
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          orderedItem: {
            $filter: {
              input: "$orderedItem",
              as: "item",
              cond: {
                $in: ["$$item.status", ["Return Request", "Cancel Request"]],
              },
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    console.log(orders);

    // console.log(orders);

    res.render("admin/cancelReturn", { orders });
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};
const rejectCancelRequest = async (req, res) => {
  const { productId, orderId, rejectReason } = req.body;
  // console.log(req.body);

  try {
    const updatedOrder = await order.findOneAndUpdate(
      { _id: orderId, "orderedItem._id": productId },
      {
        $set: {
          "orderedItem.$.status": "pending",
          "orderedItem.$.rejectionReason": rejectReason,
        },
      },
      { new: true }
    );
    // console.log(updatedOrder);
    res
      .status(200)
      .json({ success: true, message: "Cancel request rejected successfully" });
  } catch (error) {
    console.log("cancel error:", error);
    res.redirect("/admin/pageerror");
  }
};

const acceptRequest = async (req, res) => {
  const { orderId, productId, quantity, itemId, status } = req.body;
  console.log(req.body);
  const userData = req.session.user;

  try {
    let newStatus;
    if (status == "Cancel Request") newStatus = "Canceled";
    if (status == "Return Request") newStatus = "Returned";
    // console.log(newStatus);

    const prdQuantity = parseInt(quantity);
    const products = await product.findOne({ _id: productId });

    const updatedStatus = await order.findOneAndUpdate(
      { "orderedItem._id": itemId },
      {
        $set: {
          "orderedItem.$.status": newStatus,
        },
      },
      { new: true }
    );

    const findOrder = await order.findOne({ orderId: orderId });
    const findUser = await User.findById(findOrder.userId);
    // console.log(findOrder.paymentMethod);

    if (status == "Cancel Request" && findOrder.paymentMethod == "upi") {
      let userwallet = await Wallet.findOne({ user: findUser._id });
      if (!userwallet) {
        userwallet = new Wallet({ user: findUser._id, transactions: [] });
      }

      const amountToAdd = Number(products.salePrice) * Number(quantity);

      userwallet.balance = Number(userwallet.balance) + amountToAdd;
      console.log("Updated Wallet Balance:", userwallet.balance);

      userwallet.transactions.push({
        transactionType: "deposit",
        amount: amountToAdd,
        description: "Refund for canceled order",
      });

      try {
        await userwallet.save();
        console.log("Wallet Updated Successfully");
      } catch (error) {
        console.error("Error Saving Wallet:", error);
      }
    }

    // console.log("Order Status Updated:", updatedStatus);
    if (status == "Return Request" && updatedStatus) {
      let userwallet = await Wallet.findOne({ user: findUser._id });
      // console.log("User Wallet Found:", userwallet);

      if (!userwallet) {
        userwallet = new Wallet({ user: findUser._id, transactions: [] });
      }

      const amountToAdd = Number(products.salePrice) * Number(quantity);

      userwallet.balance = Number(userwallet.balance) + amountToAdd;
      console.log("Updated Wallet Balance:", userwallet.balance);

      userwallet.transactions.push({
        transactionType: "deposit",
        amount: amountToAdd,
        description: "Refund for canceled order",
      });

      try {
        await userwallet.save();
        console.log("Wallet Updated Successfully");
      } catch (error) {
        console.error("Error Saving Wallet:", error);
      }
    }

    const updatedOrder = await product.findOneAndUpdate(
      { _id: productId },
      {
        $inc: {
          quantity: prdQuantity,
        },
        $set: {
          status: "Available",
        },
      },
      { new: true }
    );
    // console.log(updatedOrder);
    res
      .status(200)
      .json({ success: true, message: "Request Accept successfully" });

    // if (["Delivered", "Cancel", "Returned"].includes(product.status)) {
    //   return res.status(400).json({
    //     message: `Status cannot be updated as it is already '${product.status}'.`,
    //   });
    // }
  } catch (error) {
    console.log("cancel error:", error);
    res.redirect("/admin/pageerror");
  }
};

const updateOrderStatus = async (req, res) => {
  const { itemId } = req.params;
  const { status } = req.body;
  // console.log(itemId, status);
  try {
    // if (["Delivered", "Cancel", "Returned"].includes(product.status)) {
    //   return res.status(400).json({
    //     message: `Status cannot be updated as it is already '${product.status}'.`,
    //   });
    // }
    const updateStatus = await order.findOneAndUpdate(
      { "orderedItem._id": itemId },
      {
        $set: {
          "orderedItem.$.status": status,
          status: status,
        },
      },
      { new: true }
    );
    console.log(updateStatus);

    if (updateStatus) {
      res.status(200).json({
        success: true,
        message: "Order status updated successfully!",
        data: updateStatus,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found or status update failed.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadCoupon = async (req, res) => {
  try {
    const allCoupons = await coupon.find();

    res.render("admin/coupon", { coupons: allCoupons });
  } catch (error) {}
};

const loadAddCoupon = async (req, res) => {
  res.render("admin/addCoupon");
};
const addCoupon = async (req, res) => {
  // console.log(req.body);

  const {
    couponName,
    couponCode,
    description,
    discount,
    status,
    maxDiscount,
    minParchase,
    startDate,
    endDate,
  } = req.body;

  if (
    !couponName ||
    !couponCode ||
    !discount ||
    !maxDiscount ||
    !minParchase ||
    !startDate ||
    !endDate
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided.",
    });
  }

  const findcoupon = await coupon.find({ couponCode, couponName });
  if (findcoupon.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Coupon code existing .",
    });
  }

  const newCoupon = new coupon({
    name: couponName,
    couponCode: couponCode,
    discription: description,
    discount: discount,
    maxDiscount: maxDiscount,
    mininumParchase: minParchase,
    startDate: startDate,
    endDate: endDate,
  });
  try {
    await newCoupon.save(); // Save to database
    res.status(200).json({
      success: true,

      message: "Coupon created successfully.",
    });
  } catch (error) {
    console.error("Error saving coupon:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the coupon.",
      error: error.message,
    });
  }
};
const loadUpdateCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const findCoupon = await coupon.findById(id);
    // console.log(findCoupon);

    res.render("admin/updateCoupon", { coupon: findCoupon });
  } catch (error) {}
};
const updateCoupon = async (req, res) => {
  const {
    couponName,
    couponCode,
    description,
    discount,
    status,
    maxDiscount,
    minParchase,
    startDate,
    endDate,
  } = req.body;
  console.log(req.body);

  if (
    !couponName ||
    !couponCode ||
    !discount ||
    !maxDiscount ||
    !minParchase ||
    !startDate ||
    !endDate
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided.",
    });
  }

  // const findcoupon = await coupon.find({ couponCode, couponName });
  // if (findcoupon.length > 0) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Coupon code existing .",
  //   });
  // }
  try {
    const result = await coupon.updateOne(
      { couponCode: couponCode }, // Find the document by its _id
      {
        $set: {
          name: couponName,
          couponCode: couponCode,
          description: description,
          discount: discount,
          isList: status,
          maxDiscount: maxDiscount,
          mininumParchase: minParchase,
          startDate: startDate,
          endDate: endDate,
        },
      }
    );

    if (result.nModified === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found or no changes made.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
const deleteCoupon = async (req, res) => {
  // console.log(req.params);

  const { id } = req.params;
  try {
    const result = await coupon.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the coupon.",
    });
  }
};

const couponStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const { status } = req.body;

    const updateStatus = await coupon.findByIdAndUpdate(
      id,
      { $set: { isList: status } },
      { new: true }
    );

    if (!updateStatus) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon status updated successfully",
      data: updateStatus,
    });
  } catch (error) {
    console.error("Error updating Coupon status:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const loadOffers = async (req, res) => {
  try {
    const allOffers = await Offer.find();
    res.render("admin/offers", { allOffers });
  } catch (error) {}
};

const loadAddOffers = async (req, res) => {
  try {
    const allProduct = await product.find({ isBlock: false });
    const allCategory = await Category.find({ status: true });

    for (const product of allProduct) {
      product.productName =
        product.productName +
        " " +
        product.variant +
        " " +
        product.processor +
        " " +
        product.color;
      product.description = "";
    }
    res.render("admin/addOffer", { allProduct, allCategory });
  } catch (error) {}
};

const addOffers = async (req, res) => {
  // console.log(product);
  const {
    offers,
    productCategory,
    title,
    description,
    offer,
    startDate,
    endDate,
    status,
  } = req.body;

  // console.log(productCategory);

  const [productName, model] = productCategory.split(" ");
  const [prdname, prdseries, varient, processor, color] =
    productCategory.split(" ");
  const products = [productName, model].join(" ");
  // console.log(prdname, prdseries, varient, processor, color);
  console.log(products, varient, color);

  try {
    const findOffer = await Offer.find({ productCategory: productCategory });

    if (findOffer.length > 0) {
      return res.status(400).json({
        success: false,
        message: "An offer already exists for this product / category.",
      });
    }

    let productDetails;
    let categoryDetails;

    let productCategoryID;

    if (offers === "product") {
      let productDetails = await product.findOne({
        productName: products,
        variant: varient,
        color: color,
      });
      // console.log(productDetails);

      productCategoryID = productDetails._id;
    } else {
      categoryDetails = await Category.findOne({ name: productCategory });
      productCategoryID = categoryDetails._id;
    }
    if (offers === "product") {
      const productStatus = await product.findOneAndUpdate(
        { _id: productCategoryID },
        { $set: { specialOffer: true } }
      );
    }
    // console.log(productStatus);

    const addOffer = await Offer.create({
      offerType: offers,
      productCategory: productCategory,
      productCategoryID: productCategoryID,
      title: title,
      description: description,
      offer: offer,
      startDate: startDate,
      endDate: endDate,
      status: status,
    });

    if (offers === "product") {
      const productStatus = product.findByIdAndUpdate(
        { productCategoryID },
        { $set: { specialOffer: true } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Offer added successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the offer.",
      error: error.message,
    });
  }
};

const loadUpdateOffers = async (req, res) => {
  const { id } = req.params;
  try {
    const findOffer = await Offer.findById(id);

    if (!findOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    res.render("admin/updateOffer", { offer: findOffer });

    // res.status(200).json({
    //   success: true,
    //   message: "Offer  updated successfully",
    //   data: updateOffer,
    // });
  } catch (error) {
    console.error("Error updating offer :", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const updateOffers = async (req, res) => {
  const {
    prdcatid,
    offers,
    productCategory,
    title,
    description,
    offer,
    startDate,
    endDate,
    status,
  } = req.body;
  try {
    console.log(req.body);

    const findOffer = await Offer.findById(prdcatid);

    if (!findOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    findOffer.offerType = offers?.trim() || findOffer.offerType;
    findOffer.productCategory = productCategory || findOffer.productCategory;
    findOffer.title = title || findOffer.title;
    findOffer.description = description || findOffer.description;
    findOffer.offer = offer || findOffer.offer;
    findOffer.startDate = startDate || findOffer.startDate;
    findOffer.endDate = endDate || findOffer.endDate;
    findOffer.status = status || findOffer.status;

    await findOffer.save();

    res.status(200).json({
      success: true,
      message: "Offer  updated successfully",
    });
  } catch (error) {
    console.error("Error updating offer :", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const updateOffersStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const { status } = req.body;
    const updateOffer = await Offer.findByIdAndUpdate(
      id,
      { $set: { status: status } },
      { new: true }
    );

    if (!updateOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Offer status updated successfully",
      data: updateOffer,
    });
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
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
  loadDashboard,
  salesData,
  discountDdata,
  ledgerData,
  loadCustomer,
  updateCustomerStatus,
  deleteCustomer,
  loadAddCustomer,
  addCustomer,
  loadUpdateCustomer,
  loadUpdateCustomerPage,
  updateCustomer,
  loadcategory,
  loadAddCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  editCategoryStatus,
  deleteCategory,
  loadproducts,
  loadAddProducts,
  pageerror,
  logout,

  loadOrders,
  loadViewOrders,
  loadCancelReturn,
  rejectCancelRequest,
  acceptRequest,
  updateOrderStatus,

  loadCoupon,
  loadAddCoupon,
  addCoupon,
  loadUpdateCoupon,
  updateCoupon,
  deleteCoupon,
  couponStatus,

  loadOffers,
  loadAddOffers,
  addOffers,
  loadUpdateOffers,
  updateOffers,
  updateOffersStatus,

  loadSales,
  salesReport,
};
