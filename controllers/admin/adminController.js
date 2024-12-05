const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const bcrypt = require("bcrypt");
const { log } = require("console");

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
    // console.log(admin);
    // const passwordHash =  await bcrypt.hash(password, 10)
    // console.log(passwordHash);
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
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  try {
    res.render("admin/dashboard");
  } catch (error) {
    console.log("Dashboard error:", error);
    res.redirect("/admin/pageerror");
  }
};

const loadCustomer = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }

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
            { name: new RegExp(searchQuery, "i") }, // Search by name (case-insensitive)
            { email: new RegExp(searchQuery, "i") }, // Search by email (case-insensitive)
          ],
        },
      ],
    };

    // Add isBlock filter if specified
    if (isBlockFilter) {
      query.$and.push({ isBlock: isBlockFilter === "true" });
    }

    // Fetch matching users with pagination
    const totalCustomers = await User.countDocuments(query); // Total number of matching customers
    const user = await User.find(query).skip(skip).limit(limit);

    const totalPages = Math.ceil(totalCustomers / limit); // Calculate total pages

    // Render the customer page with required data
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

// Update user status route
const updateCustomerStatus = async (req, res) => {
  const { userId } = req.params;
  const { isBlock } = req.body;

  try {
    // Update the user's `isBlock` status in the database
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
    // Attempt to delete the user
    const result = await User.findOneAndDelete({ _id: id });
    // console.log(result);

    // If result is null, the user was not found
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
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  try {
    const seccess = req.session.successMessage || null;
    req.session.successMessage = null;
    res.render("admin/addCustomer",{seccess});
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
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }

  try {
    const { name, email, secondaryEmail, phone, status, password } = req.body;



    // Validate required fields
    if (!name || !email) {
      return res.render("admin/addCustomer", {
        message: "Name and Email are required.",
      });
    }

    // Check if the customer already exists
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("admin/addCustomer", {
        message: "Customer already exists.",
      });
    }

    // Hash the password if provided
    const passwordHash = password ? await securePassword(password) : null;

    // Determine status
    const isBlock = status === "true";

    // Save the new customer
    const saveUserData = new User({
      name,
      email,
      secondaryEmail,
      phone,
      isBlock,
      password: passwordHash,
    });

    await saveUserData.save();

    // Redirect with success message
    req.session.successMessage = "Customer added successfully!";
    return res.redirect("/admin/addCustomer");
  } catch (error) {
    console.error("addCustomer error:", error);

    // Handle error properly
    return res.status(500).render("admin/pageerror", {
      error: "Internal Server Error",
    });
  }
};


const loadUpdateCustomer = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  const { id } = req.params;
  try {
    const user = await User.find({ _id: id });
    // console.log(user);

    if (user) {
      return res.render("admin/updateCustomer", { user });
    }
  } catch (error) {}
};
const loadUpdateCustomerPage = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  const { id } = req.params;

  try {
    const user = await User.find({ _id: id });
    // Retrieve success and error messages from the session
    const success = req.session.successMessage || null;
    const message = req.session.errorMessage || null;

    // Clear the session messages to avoid re-displaying them
    req.session.successMessage = null;
    req.session.errorMessage = null;

    // Render the page, passing both success and message (even if null)
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
      // req.session.errorMessage = "User not found.";
      return res.redirect("/admin/customer");
    }

    const passwordHash = password
      ? await securePassword(password)
      : findUser.password;

    const isBlock = status === "true"; // Convert status to Boolean
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
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({})
      .sort({ createAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit); // Update to totalPages

    const successMessage = req.session.successMessage || null;
    req.session.successMessage = null; // Clear the message after using it

    res.render("admin/category", {
      category: categoryData,
      currentPage: page,
      totalPages: totalPages, // Update to totalPages
      totalCategories: totalCategories,
      success: successMessage,
    });
  } catch (error) {
    console.log("category error:", error);
    res.redirect("/admin/pageerror");
  }
};

const loadAddCategory = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  try {
    const successMessage = req.session.successMessage || null;
    req.session.successMessage = null; // Clear the message after using it
    res.render("admin/addCategory", { success: successMessage });
  } catch (error) {
    console.log("addCategory error:", error);
    res.redirect("/admin/pageerror");
  }
};

const addCategory = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }

  try {
    const { category, description, categoryStatus } = req.body;

    const trimmedName = category.trim();
    const nameExists = await Category.findOne({ name: trimmedName });

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

    // Use redirect after successful addition
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
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  const { id } = req.params;
  //   console.log(id);
  try {
    const category = await Category.find({ _id: id });
    res.render("admin/editCategory", { category });
  } catch (error) {
    console.log("addCategory error:", error);
    res.redirect("/admin/pageerror");
  }
};

const editCategory = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }

  try {
    const { category, description, categoryStatus } = req.body;

    const trimmedName = category.trim();
    const nameExists = await Category.findOne({ name: trimmedName });

    const booleanValue = categoryStatus === "list";
    const result = await Category.updateOne(
      { _id: req.body.id }, // Assuming `id` is passed in the form
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
      res
        .status(200)
        .json({ success: true, message: "Category deleted successfully." });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user.",
    });
  }
};

const loadproducts = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  try {
    res.render("admin/products");
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};
const loadAddProducts = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  try {
    res.render("admin/addProduct");
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};

const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session", err);
        return re.redirect("/admin/pageerror");
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
};
