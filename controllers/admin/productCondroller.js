const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const fs = require("fs");
const path = require("path");
// const sharp = require("sharp");
const multer = require("multer");

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(null, ` ${Date.now()}-${file.filename || file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const uploadImages = upload.array("images"); // Define middleware to handle multiple images

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

const addProducts = async (req, res) => {
  try {
    const {
      productName,
      stock,
      quantity,
      category,
      description,
      color,
      variant,
      processor,
      offer,
      price,
    } = req.body;

    const imagePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
    const iscategory = await Category.findOne({ name: category });

    if (!iscategory) {
      return res.status(400).json({ message: "Category not found!" });
    }

    // Check if product already exists
    const isproduct = await Product.findOne({
      productName,
      color,
      variant,
      processor,
    });

    if (isproduct) {
      console.log(isproduct);

      console.log("product already exist");
      return res.json({ success: false, message: "Product already exists" });
    }

    // Create new product if it doesn't exist
    const newProduct = new Product({
      productName,
      stock,
      quantity,
      category: iscategory._id,
      description,
      color,
      variant,
      processor,
      productOffer: offer,
      regularPrice: price,
      salePrice: price,
      productImage: imagePaths,
    });

    const result = await newProduct.save();

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Product not added!",
      });
    }

    // Send success response if product is added successfully
    return res.json({ success: true, message: "Product added successfully!" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// const addProducts = async (req, res) => {
//   try {
//     // Parse JSON fields
//     const colors = JSON.parse(req.body.colors || "[]");
//     const variants = JSON.parse(req.body.variants || "[]");

//     // Ensure the target directory exists
//     const targetDir = path.join(__dirname, "../../public/productsImage");
//     if (!fs.existsSync(targetDir)) {
//       fs.mkdirSync(targetDir, { recursive: true }); // Create the directory if it doesn't exist
//     }

//     // Process uploaded files
//     req.files.forEach((file) => {
//       // Save file to the public/productsImage folder
//       const filePath = path.join(targetDir, file.originalname);
//       fs.writeFileSync(filePath, file.buffer); // Save file to the directory
//     });

//     // Log the data for debugging
//     console.log("Product Name:", req.body.productName);
//     console.log("Colors:", colors);
//     console.log("Variants:", variants);

//     res.json({ message: "Product added successfully!" });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };

module.exports = {
  loadproducts,
  loadAddProducts,
  addProducts,
  uploadImages,
};
