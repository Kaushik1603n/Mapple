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

module.exports = {
  loadCustomer,
  updateCustomerStatus,
  deleteCustomer,
  loadAddCustomer,
  addCustomer,
  loadUpdateCustomer,
  loadUpdateCustomerPage,
  updateCustomer,
};
