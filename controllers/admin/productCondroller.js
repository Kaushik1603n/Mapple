const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

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
    const category = await Category.find({ status: true });
    // console.log("Fetched categories:", category); 
    res.render("admin/addProduct", { cat: category });
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};

module.exports = {
  loadproducts,
  loadAddProducts,
};
