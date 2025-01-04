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

  module.exports={
    loadcategory,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    editCategoryStatus,
    deleteCategory,
  }