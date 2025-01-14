const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/productSchema");
const address = require("../../models/addressSchema");
const cart = require("../../models/cartSchema");
const order = require("../../models/orderSchema");
const Review = require("../../models/reviewSchema");
const Offer = require("../../models/offerSchema");
const wishlist = require("../../models/wishlistSchema");
const Wallet = require("../../models/walletSchema");
const coupon = require("../../models/couponSchema");
const Razorpay = require("razorpay");
const Referral = require("../../models/referralSchema");
const failedorder = require("../../models/faildOrders");
const PDFDocument = require("pdfkit");

const loadCheckout = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    let userAddress = await address.findOne({ userId: userId });
    let userCoupon = await coupon.findOne({ userId: userId });
    // console.log(userCoupon);
    const couponCode = req.session.couponCode;
    const userCart = await cart.findOne({ userId });

    res.render("user/checkOut", { userAddress, userCart, couponCode });
  } catch (error) {}
};

const placeOrder = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  const couponCode = req.session.couponCode;

  try {
    const {
      orderedItem,
      deliveryAddress,
      billingDetails,
      paymentMethod,
      status,
      couponApplied,
      couponDiscount,
      finalTotalAmount,
      paymentIds,
      deliveryChargeValue,
    } = req.body;
    const couponDisc =
      parseFloat(((couponDiscount || "0") + "").replace(/[^\d.-]/g, "")) || 0;
    const totalAmounts =
      parseFloat(((finalTotalAmount || "0") + "").replace(/[^\d.-]/g, "")) || 0;

    if (!orderedItem || orderedItem.length === 0) {
      return res.status(400).json({ error: "Ordered items are required." });
    }
    if (!deliveryAddress || !billingDetails || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const couponPercentage = req.session.couponDiscount;

    let findcoupon;
    if (couponCode) {
      findcoupon = await coupon.findOne({
        couponCode: couponCode,
        isList: true,
      });
      findcoupon.userId.push(userData._id);
      await findcoupon.save();
    }
    let maxDiscount = 0;
    if (findcoupon) {
      maxDiscount = findcoupon.maxDiscount || false;
    }

    let totalCouponDiscount = 0;
    let adjustedDiscounts = 0;

    if (maxDiscount) {
      if (orderedItem.length === 1) {
        const item = orderedItem[0];
        const itemDiscount =
          item.quantity * item.price * (couponPercentage / 100);
        totalCouponDiscount = Math.min(itemDiscount, maxDiscount); // Cap to maxDiscount
        item.couponDisnd = totalCouponDiscount;
      } else {
        let totalDiscount = 0;

        const productDiscounts = orderedItem.map((item) => {
          const itemDiscount =
            item.quantity * item.price * (couponPercentage / 100);
          totalDiscount += itemDiscount;
          return { ...item, itemDiscount };
        });

        if (totalDiscount > maxDiscount) {
          const discountRatio = maxDiscount / totalDiscount;
          adjustedDiscounts = productDiscounts.map((item) => ({
            ...item,
            finalDiscount: item.itemDiscount * discountRatio,
          }));
          totalCouponDiscount = maxDiscount;
        } else {
          adjustedDiscounts = productDiscounts.map((item) => ({
            ...item,
            finalDiscount: item.itemDiscount,
          }));
          totalCouponDiscount = totalDiscount;
        }

        adjustedDiscounts.forEach((item, index) => {
          orderedItem[index].couponDisnd = item.finalDiscount;
        });
      }
    } else {
      orderedItem.forEach((item, index) => {
        item.couponDisnd = 0;
      });
    }

    let finalAmount = Number(deliveryChargeValue);
    let totalPrice = 0;
    const orderedProduct = [];
    for (const item of orderedItem) {
      const product = await Product.findById(item.product); // product means productId
      if (!product) {
        const deleteCartItem = await cart.updateOne(
          { "items.productId": item.product },
          { $pull: { items: { productId: item.product } } }
        );
        return res
          .status(404)
          .json({ error: `Product with ID ${item.product} not found.` });
      }

      totalPrice += item.quantity * product.regularPrice;
      finalAmount += item.quantity * item.price;
      orderedProduct.push({
        product: product._id,
        productName: product.productName,
        firstImage: product.productImage[0],
        productColor: product.color,
        productStorage: product.variant,
        productProcessor: product.processor,
        description: product.description,
        quantity: item.quantity,
        regularPrice: product.regularPrice,
        regularTotal: product.regularPrice * item.quantity,
        price: item.price,
        total: item.quantity * item.price - item.couponDisnd,
        couponDiscount: item.couponDisnd,
        discount:
          product.regularPrice * item.quantity - item.quantity * product.price,
      });
    }
    // console.log(finalAmount);

    if (paymentMethod == "wallet") {
      let userwallet = await Wallet.findOne({ user: userId });

      if (!userwallet) {
        return res.status(404).json({ error: `insufficient balance` });
      }
      // console.log(finalAmount);

      if (userwallet.balance < finalAmount) {
        return res.status(404).json({ error: `insufficient balance` });
      }
      const amountToDebit = finalAmount - couponDisc;
      userwallet.balance = Number(userwallet.balance) - amountToDebit;
      console.log("Updated Wallet Balance:", userwallet.balance);

      userwallet.transactions.push({
        transactionType: "withdrawal",
        amount: amountToDebit,
        description: "wallet using payment",
      });

      try {
        await userwallet.save();
        console.log("Order completed using wallet Successfully");
      } catch (error) {
        console.error("Error Order place using Wallet:", error);
      }
    }

    const orderId = ` ORD${Date.now()}`;
    const newOrder = await order.create({
      orderId: orderId,
      userId: userId,
      orderedItem: orderedProduct,
      totalPrice,
      discount: totalPrice - finalAmount + couponDisc,
      finalAmount: finalAmount - couponDisc,
      deliveryAddress: deliveryAddress,
      billingDetails: billingDetails,
      invoiceDate: new Date(),
      status: status,
      couponApplied: couponApplied || false,
      couponDiscount: couponDisc,
      paymentMethod,
      deliveryCharge: deliveryChargeValue,
    });
    // console.log(finalAmount - couponDisc);

    if (!newOrder) {
      return res.status(404).json({ error: "Order not placed" });
    }

    for (const item of orderedProduct) {
      // const updatedProduct = await Product.findById(item.product);
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      if (updatedProduct && updatedProduct.quantity === 0) {
        await Product.findByIdAndUpdate(item.product, {
          $set: { status: "Out of stock" },
        });
        // console.log(`Product ${item.product} is now out of stock.`);
      }
      // console.log(updatedProduct);
    }

    const deleteDemoOrder = await failedorder.findOneAndDelete({
      paymentId: paymentIds,
    });
    // if (deleteDemoOrder) {
    //   console.log("success");
    // }

    await cart.findOneAndDelete({ userId: userId });
    req.session.couponDiscount = null;
    req.session.couponCode = null;

    req.session.paymentData = null;
    req.session.orderId = null;

    res.status(404).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

const verifyPayment = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  const couponCode = req.session.couponCode;

  const {
    orderedItem,
    deliveryAddress,
    billingDetails,
    paymentMethod,
    status,
    couponApplied,
    couponDiscount,
    finalTotalAmount,
    deliveryChargeValue,
  } = req.body;
  const couponDisc =
    parseFloat(((couponDiscount || "0") + "").replace(/[^\d.-]/g, "")) || 0;
  const totalAmounts =
    parseFloat(((finalTotalAmount || "0") + "").replace(/[^\d.-]/g, "")) || 0;

  if (!orderedItem || orderedItem.length === 0) {
    return res.status(400).json({ error: "Ordered items are required." });
  }
  if (!deliveryAddress || !billingDetails || !paymentMethod) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const couponPercentage = req.session.couponDiscount;

  let findcoupon;
  if (couponCode) {
    findcoupon = await coupon.findOne({
      couponCode: couponCode,
      isList: true,
    });
  }

  let maxDiscount = 0;
  if (findcoupon) {
    maxDiscount = findcoupon.maxDiscount || false;
  }

  let totalCouponDiscount = 0;
  let adjustedDiscounts = 0;

  if (maxDiscount) {
    if (orderedItem.length === 1) {
      const item = orderedItem[0];
      const itemDiscount =
        item.quantity * item.price * (couponPercentage / 100);
      totalCouponDiscount = Math.min(itemDiscount, maxDiscount); // Cap to maxDiscount
      item.couponDisnd = totalCouponDiscount;
    } else {
      let totalDiscount = 0;

      const productDiscounts = orderedItem.map((item) => {
        const itemDiscount =
          item.quantity * item.price * (couponPercentage / 100);
        totalDiscount += itemDiscount;
        return { ...item, itemDiscount };
      });

      if (totalDiscount > maxDiscount) {
        const discountRatio = maxDiscount / totalDiscount;
        adjustedDiscounts = productDiscounts.map((item) => ({
          ...item,
          finalDiscount: item.itemDiscount * discountRatio,
        }));
        totalCouponDiscount = maxDiscount;
      } else {
        adjustedDiscounts = productDiscounts.map((item) => ({
          ...item,
          finalDiscount: item.itemDiscount,
        }));
        totalCouponDiscount = totalDiscount;
      }

      adjustedDiscounts.forEach((item, index) => {
        orderedItem[index].couponDisnd = item.finalDiscount;
      });
    }
  } else {
    orderedItem.forEach((item, index) => {
      item.couponDisnd = 0;
    });
  }


  let finalAmount = Number(deliveryChargeValue);
  let totalPrice = 0;
  const orderedProduct = [];
  for (const item of orderedItem) {
    const product = await Product.findById(item.product); // product means productId
   console.log(product);
   
    if (!product) {
      const deleteCartItem = await cart.updateOne(
        { "items.productId": item.product },
        { $pull: { items: { productId: item.product } } }
      );
      return res
        .status(404)
        .json({ error: `Product with ID ${item.product} not found.` });
    }

    totalPrice += item.quantity * product.regularPrice;
    finalAmount += item.quantity * item.price;
    orderedProduct.push({
      product: product._id,
      productName: product.productName,
      firstImage: product.productImage[0],
      productColor: product.color,
      productStorage: product.variant,
      productProcessor: product.processor,
      description: product.description,
      quantity: item.quantity,
      regularPrice: product.regularPrice,
      regularTotal: product.regularPrice * item.quantity,
      price: item.price,
      total:
        item.quantity * item.price - item.couponDisnd,
        // (item.quantity * item.price -
        //   item.quantity * item.price * (1 - couponPercentage / 100) || 0),
      couponDiscount:
        item.couponDisnd,
          // item.quantity * item.price * (1 - couponPercentage / 100) || 0,
      discount:
        product.regularPrice * item.quantity - item.quantity * product.price,
    });
  }

  const razorpayInstance = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_TEST_KEY_ID,
  });
  const discount = couponDisc ?? 0;
  // console.log((finalAmount - discount) * 100);
  const amountAfterDiscount = finalAmount - discount;

  const amount = Math.round(amountAfterDiscount * 100);
  const currency = "INR";

  try {
    console.log(amount, currency);

    const order = await razorpayInstance.orders.create({
      amount,
      currency,
    });

    const orderId = ` ORD${Date.now()}`;
    const newOrder = await failedorder.create({
      orderId: orderId,
      userId: userId,
      orderedItem: orderedProduct,
      totalPrice,
      discount: totalPrice - finalAmount + couponDisc,
      finalAmount: finalAmount - couponDisc,
      deliveryAddress: deliveryAddress,
      billingDetails: billingDetails,
      invoiceDate: new Date(),
      status: "Payment Pending",
      couponApplied: couponApplied || false,
      couponDiscount: couponDisc,
      paymentMethod,
      paymentId: order.id,
      deliveryCharge: deliveryChargeValue,
    });
    await cart.findOneAndDelete({ userId: userId });
    req.session.paymentData = true;
    req.session.orderId = order.id;

    return res.json({ orderId: order.id, amount });
  } catch (error) {
    console.error("payment err", error);
    res.status(500).send("Error creating order");
  }
};

const paymentFailed = async (req, res) => {
  if (!req.session.paymentData) {
    return res.redirect("/user");
  }
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    res.render("user/paymentFailed");
    req.session.paymentData = null;
  } catch (error) {
    console.error("Error rendering paymentFailed page:", error);
    res.status(500).send("Internal Server Error");
  }
};

const retryPayment = async (req, res) => {
  const { orderId } = req.body;
  const razorpay = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_TEST_KEY_ID,
  });

  try {
    const order = await razorpay.orders.fetch(orderId);
    // console.log(order.status);

    if (order.status === "paid") {
      return res.status(400).json({ message: "Order is already paid." });
    } else if (order.status === "expired") {
      const newOrder = await razorpay.orders.create({
        amount: order.amount,
        currency: "INR",
        receipt: `receipt_${orderId}`,
      });
      return res.json({ orderId: newOrder.id, amount: newOrder.amount });
    } else if (order.status === "attempted") {
      return res.json({ orderId: order.id, amount: order.amount });
    }

    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Failed to process re-payment.");
  }
};

const updateOrder = async (req, res) => {
  const { orderId, paymentResponse } = req.body;
  console.log(orderId);

  try {
    const findOrder = await failedorder.findOne({ paymentId: orderId });
    if (!findOrder) {
      return console.log("Order not found in failedorder collection");
    }
    console.log(findOrder);
    const updatedOrderData = {
      ...findOrder.toObject(),
      status: "pending",
    };

    const result = await order.create(updatedOrderData);

    req.session.paymentData = null;
    req.session.orderId = null;

    await failedorder.deleteOne({ paymentId: orderId });
    console.log("Order removed from failedorder collection");
    res.status(200).json({ success: true, message: "successfully Re-payment" });
  } catch (error) {
    console.error("Error moving order:", error);
  }
};

const getCoupon = async (req, res) => {
  try {
    // Find coupons with isList set to true
    const findcoupon = await coupon.find({
      isList: true,
    });
    console.log(findcoupon);

    // If no coupons are found, return an empty array
    if (!findcoupon || findcoupon.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // If coupons are found, return them in the response
    res.status(200).json({ data: findcoupon });
  } catch (error) {
    // Handle error: log it and send a failure response
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const applyCoupon = async (req, res) => {
  const { couponCode, totalAmount } = req.body;
  const userData = req.session.user;
  try {
    const findcoupon = await coupon.findOne({
      couponCode: couponCode,
      isList: true,
    });

    if (!findcoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired coupon." });
    }


    if (findcoupon.userId.includes(userData._id)) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon already used." });
    } else {
      // findcoupon.userId.push(userData._id);
      // await findcoupon.save();
    }

    if (findcoupon.expiryDate < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired." });
    }

    if (totalAmount < findcoupon.mininumParchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value must be ₹${findcoupon.mininumParchase} to apply this coupon.`,
      });
    }

    let discount = 0;
    if (findcoupon) {
      discount = Math.min(
        (findcoupon.discount / 100) * totalAmount,
        findcoupon.maxDiscount || Infinity
      );
    }
    const finalAmount = totalAmount - discount;

    req.session.couponCode = couponCode;
    req.session.couponDiscount = findcoupon.discount;
    
    res.status(200).json({
      success: true,
      message: "Coupon applied successfully!",
      discount,
      finalAmount,
    });
  } catch (error) {}
};

const removeCoupon = async (req, res) => {
  const { couponCode, totalAmount } = req.body;
  const userData = req.session.user;

  try {
    const findcoupon = await coupon.findOne({ couponCode: couponCode });

    if (findcoupon) {
      const userIdToRemove = userData._id.toString();

      findcoupon.userId = findcoupon.userId.filter(
        (id) => id.toString() !== userIdToRemove
      );

      await findcoupon.save();
      req.session.couponCode = null;

      return res.status(200).json({
        success: true,
        message: "Coupon removed successfully",
        couponCode,
        totalAmount,
      });
    } else {
      console.log("Coupon not found.");
      return res.status(404).json({ message: "Coupon not found" });
    }
  } catch (error) {
    console.error("Error while removing coupon:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  loadCheckout,
  placeOrder,
  verifyPayment,
  paymentFailed,
  retryPayment,
  updateOrder,
  getCoupon,
  applyCoupon,
  removeCoupon,
};
