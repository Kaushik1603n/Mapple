const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const fs = require("fs");
const path = require("path");
// const sharp = require("sharp");
const multer = require("multer");
const product = require("../../models/productSchema");

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/productsImage");
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
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not provided
    const limit = 5; // Number of products per page
    const skip = (page - 1) * limit;

    // Aggregation pipeline with consistent matching
    const query = {
      $or: [
        { productName: new RegExp(searchQuery, "i") }, // Search by product name
        { processor: new RegExp(searchQuery, "i") }, // Search by processor
      ],
    };

    const productsWithCategory = await Product.aggregate([
      { $match: query }, // Apply search filter
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $addFields: {
          categoryName: "$categoryDetails.name", // Include category name
        },
      },
      {
        $project: {
          categoryDetails: 0, // Exclude the full categoryDetails object
        },
      },
      { $skip: skip }, // Skip products for pagination
      { $limit: limit }, // Limit products for pagination
    ]);

    // Count total documents using the same match criteria
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Render the products page with the necessary data
    res.render("admin/products", {
      productsWithCategory,
      currentPage: page,
      totalPages,
      totalProducts,
      searchQuery,
    });
    // res.render("admin/products", { productsWithCategory });
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

    console.log(req.files);

    const imagePaths = req.files.map(
      (file) => `/productsImage/${file.filename}`
    );
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

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // const find = await Product.findOne({ _id: id });
    // console.log(find);    
    // const result = await Product.findOneAndDelete({ _id: id });

    const result = await Product.findByIdAndDelete({_id: id})
    if (result) {
      res
        .status(200)
        .json({ success: true, message: "Product deleted successfully." });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }
  } catch (error) {
    console.error("Error deleting Product:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the Product.",
    });
  }
};

module.exports = {
  loadproducts,
  loadAddProducts,
  addProducts,
  uploadImages,
  deleteProduct,
};
