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

const loadOffers = async (req, res) => {
  try {
    const allOffers = await Offer.find();
    res.render("admin/offers", { allOffers });
  } catch (error) {}
};
const getOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const allOffers = await Offer.find().skip(skip).limit(limit);

    const totalOffers = await Offer.countDocuments();

    const totalPages = Math.ceil(totalOffers / limit);

    res.status(200).json({
      success: true,
      allOffers,
      totalPages,
      currentPage: page,
      totalOffers,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
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

module.exports = {
  loadOffers,
  getOffers,
  loadAddOffers,
  addOffers,
  loadUpdateOffers,
  updateOffers,
  updateOffersStatus,
};
