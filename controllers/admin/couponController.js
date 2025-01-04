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

const loadCoupon = async (req, res) => {
    try {
      const allCoupons = await coupon.find();
  
      res.render("admin/coupon", { coupons: allCoupons });
    } catch (error) {}
  };
  const getAllCoupon = async (req, res) => {
    try {
      const allCoupons = await coupon.find();
  
      res.json({ success: true, coupons: allCoupons });
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


  module.exports={
    loadCoupon,
    getAllCoupon,
    loadAddCoupon,
    addCoupon,
    loadUpdateCoupon,
    updateCoupon,
    deleteCoupon,
    couponStatus,
  }