const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/productSchema");
const address = require("../../models/addressSchema");
const cart = require("../../models/cartSchema");
const order = require("../../models/orderSchema");
const Review = require("../../models/reviewSchema");

const wishlist = require("../../models/wishlistSchema");
const Wallet = require("../../models/walletSchema");
const coupon = require("../../models/couponSchema");
const Razorpay = require("razorpay");
const Offer = require("../../models/offerSchema");
const Referral = require("../../models/referralSchema");
const failedorder = require("../../models/faildOrders");
const PDFDocument = require("pdfkit");

const loadUserAccount = async (req, res) => {
  const userData = req.session.user;
  if (!req.session.user) {
    return res.redirect("/user/login");
  }
  try {
    const findUser = await User.findById(userData._id);

    res.render("user/userAccount", { userData: findUser || {} });
  } catch (error) {
    console.log(error);
  }
};

const userAccount = async (req, res) => {
  const userData = req.session.user;
  try {
    const { name, email, newemail, secondaryEmail, phone } = req.body;
    // console.log(req.body);

    if (!name || !email || !newemail || !secondaryEmail || !phone) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      return res.status(400).json({ message: "Account Not Fount" });
    }

    const checkUser = await User.findOne({
      email: newemail,
      _id: { $ne: findUser._id },
    });
    if (checkUser) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another account." });
    }

    findUser.name = name;
    findUser.email = newemail;
    findUser.secondaryEmail = secondaryEmail;
    findUser.phone = phone;
    await findUser.save();

    const updatedUser = await User.findById(findUser._id);

    res
      .status(200)
      .json({ success: "Account updated successfully", userData: updatedUser });
  } catch (error) {
    console.error("Error updating user account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const accountChangePass = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword, email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating user account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userAddress = async (req, res) => {
  const userData = req.session.user;
  try {
    const userId = userData._id;
    let userAddress = await address.findOne({ userId: userId });

    return res.render("user/address", {
      userAddress: userAddress ? userAddress.address : [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save address." });
  }
};

const getUserAddress = async (req, res) => {
  const userData = req.session.user;
  try {
    const userId = userData._id;
    let userAddress = await address.findOne({ userId: userId });

    return res.json({
      success: true,
      userAddress: userAddress ? userAddress.address : [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save address." });
  }
};

const addAddress = async (req, res) => {
  const userData = req.session.user;
  try {
    const userId = userData._id;
    const { ...addressData } = req.body;

    let userAddress = await address.findOne({ userId });
    console.log(userData);
    console.log(userId);

    if (!userAddress) {
      userAddress = new address({
        userId,
        address: [addressData],
      });
    } else {
      const addressLimit = userAddress.address.length;
      if (addressLimit >= 5) {
        return res.status(400).json({ message: "Only store 5 address" });
      }
      userAddress.address.push(addressData);
    }

    await userAddress.save();
    return res.status(201).json({ message: "Address saved successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save address." });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    await address.updateOne(
      { "address._id": addressId },
      { $pull: { address: { _id: addressId } } }
    );
    res.status(200).send({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).send({ error: "Failed to delete address" });
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const updatedData = req.body;

    await address.updateOne(
      { "address._id": addressId },
      { $set: { "address.$": updatedData } }
    );

    res.status(200).send({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).send({ error: "Failed to update address" });
  }
};
const loadOrders = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const orderedItem = await order.find({ userId }).sort({ createdAt: -1 });
    const faildOrders = await failedorder
      .find({ userId })
      .sort({ createdAt: -1 });

    res.render("user/orders", {
      orders: orderedItem || [],
      faildOrders: faildOrders || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed get Orders" });
  }
};
const loadOrdersDetails = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  const id = req.params.id;
  try {
    const orderDetails = await order.find({ orderId: id });

    res.render("user/orderDetails", { orderDetails: orderDetails || [] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed get Orders" });
  }
};
const loadFailedOrdersDetails = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  const id = req.params.id;
  try {
    const orderDetails = await failedorder.find({ orderId: id });

    res.render("user/failedOrderDetails", { orderDetails: orderDetails || [] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed get Orders" });
  }
};
const returnProduct = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  const { itemId, reason } = req.body;
  try {
    await order.updateOne(
      { "orderedItem._id": itemId },
      {
        $set: {
          "orderedItem.$.status": "Return Request",
          "orderedItem.$.reason": reason,
        },
      }
    );

    res.json({
      message: "Your Return request has been sent to the admin for review.",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Failed to send the request." });
  }
};
const cancelProduct = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  const { itemId, reason } = req.body;
  try {
    const result = await order.updateOne(
      { "orderedItem._id": itemId },
      {
        $set: {
          "orderedItem.$.status": "Cancel Request",
          "orderedItem.$.reason": reason,
        },
      }
    );

    res.json({
      success: "Your Cancel request has been sent to the admin for review.",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Failed to send the request." });
  }
};

const productReview = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const { title, rating, comments, productId } = req.body;

    if (!title || !rating || !comments || !productId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }

    const addReview = await Review.create({
      product: productId,
      user: userId,
      reviewTittle: title,
      rating: rating,
      reviewText: comments,
    });

    res
      .status(200)
      .json({ success: true, message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Error handling review submission:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addWishlist = async (req, res) => {
  if (!req.session.user) {
    return res.status(404).json({ error: "Login First" });
  }
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const { productId, liked } = req.body;

    const findUser = await wishlist.findOne({ userId: userId });

    if (liked) {
      if (findUser) {
        const checkWishlist = await wishlist.findOne({
          userId: userId,
          product: { $elemMatch: { productId: productId } },
        });
        if (checkWishlist) {
          console.log("Product already exists in the wishlist.");
        } else {
          const addWishlist = await wishlist.updateOne(
            { userId: userId },
            {
              $push: {
                product: {
                  productId: productId,
                },
              },
            }
          );
        }
      } else {
        const addWishlistItems = await wishlist.create({
          userId: userId,
          product: [
            {
              productId: productId,
            },
          ],
        });
      }
    } else {
      const unlikeItem = await wishlist.updateOne(
        { userId: userId },
        {
          $pull: {
            product: { productId: productId },
          },
        }
      );
      return res.status(200).json({ message: "successfully removed" });
    }

    res.status(200).json({ message: "success fully completed" });
  } catch (error) {}
};

const loadWishList = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const wishlistItems = await wishlist.find({ userId: userId });

    const allProduct = [];

    for (const item of wishlistItems) {
      for (const product of item.product) {
        const wishlistProduct = await Product.findById(product.productId);
        allProduct.push(wishlistProduct);
      }
    }

    res.render("user/wishlist", { allProduct });
  } catch (error) {}
};
const loadWishListItems = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const wishlistItems = await wishlist.find({ userId: userId });

    const allProduct = [];

    for (const item of wishlistItems) {
      for (const product of item.product) {
        const wishlistProduct = await Product.findById(product.productId);
        allProduct.push(wishlistProduct);
      }
    }

    console.log(allProduct);

    res.json({ success: true, allProduct });
  } catch (error) {}
};

const removeWishList = async (req, res) => {
  const { id } = req.params;
  const userData = req.session.user;
  const userId = userData._id;

  try {
    const result = await wishlist.updateOne(
      { userId: userId },
      { $pull: { product: { productId: id } } }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: "Product removed successfully" });
    } else {
      return res.status(400).json({ message: "Failed to remove product" });
    }
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loadWallet = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user");
  }
  const userData = req.session.user;
  try {
    const user = await Wallet.findOne({ user: userData._id }).populate("user");

    res.render("user/wallet", { user });
  } catch (error) {}
};
const loadWalletHistory = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user");
  }
  const userData = req.session.user;
  try {
    const walletHistory = await Wallet.findOne({ user: userData._id }).populate(
      "user"
    );

    res.json({ success: true, transaction: walletHistory });
  } catch (error) {}
};

const addMoney = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user");
  }
  const userData = req.session.user;
  const { amount } = req.body;
  try {
    let userwallet = await Wallet.findOne({ user: userData._id });
    if (!userwallet) {
      userwallet = new Wallet({ user: userData._id, transactions: [] });
    }
    userwallet.balance = Number(userwallet.balance) + Number(amount);

    userwallet.transactions.push({
      transactionType: "deposit",
      amount: amount,
      description: "nothing",
    });

    const updatedWallet = await userwallet.save();
    res
      .status(200)
      .json({ success: true, message: "successfully added", updatedWallet });
  } catch (error) {}
};

const loadReferral = async (req, res) => {
  const userData = req.session.user;

  function generateReferralCode(username) {
    return (
      username.replace(" ", "") +
      Math.random().toString(36).substr(2, 6).toUpperCase()
    );
  }

  try {
    let findReferral = await User.findOne({ _id: userData._id });
    if (!findReferral.referralCode) {
      const referralCode = generateReferralCode(findReferral.name);
      findReferral.referralCode = referralCode;
      console.log(referralCode);

      await findReferral.save();
    }

    const allReferrals = await Referral.find({ referredUsers: userData._id });
    let referralBonus = 0;
    if (allReferrals.length > 0) {
      for (const doc of allReferrals) {
        if (doc.referralCode) {
          referralBonus += 100;
        }
      }
    }

    res.render("user/referral", {
      ReferralCode: findReferral.referralCode,
      referralBonus,
      allReferrals,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const generateSalesInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderDetails = await order.findOne({ orderId }).populate("userId");

    if (!orderDetails) {
      return res.status(404).json({ message: "Order not found" });
    }

    generateInvoice(orderDetails, res);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

function generateInvoice(order, res) {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `invoice-${order.orderId}.pdf`;

  res.setHeader("Content-Disposition", ` attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  doc
    .fontSize(24)
    .text("Mapple Order Invoice", { align: "center" })
    .fontSize(10)
    .fillColor("gray")
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
    .moveDown(2);

  doc
    .fontSize(10)
    .fillColor("#000000")
    .text("Mapple Store Ltd.", 50, 100)
    .text("Kasargod, VT / 82021", 50, 115)
    .text("Phone: 8943548236", 50, 130);

  doc
    .text(`${order.billingDetails.homeAddress}`, 400, 100, { align: "right" })
    .text(`${order.billingDetails.landmark}`, 400, 145, { align: "right" })
    .text(
      `${order.billingDetails.country}, ${order.billingDetails.state}, ${order.billingDetails.city}`,
      400,
      115,
      { align: "right" }
    )
    .text(`${order.billingDetails.zipCode}`, 400, 130, { align: "right" })
    .text(`${order.billingDetails.phoneNumber}`, 400, 160, { align: "right" });

  doc
    .moveDown(2)
    .fontSize(10)
    .fillColor("#333333")
    .text(`Invoice Number: ${order.orderId}`, 50, 200)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 215);

  const tableTop = 270;
  const tableHeaderHeight = 20;
  doc
    .fontSize(10)
    .fillColor("#333333")
    .text("Product", 50, tableTop)
    .text("Color", 150, tableTop, { width: 100, align: "left" })
    .text("Rate", 300, tableTop, { width: 50, align: "right" })
    .text("Quantity", 380, tableTop, { width: 50, align: "right" })
    .text("Status", 450, tableTop, { width: 50, align: "right" })
    .text("Total", 520, tableTop, { width: 50, align: "right" });

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke("#cccccc");

  let position = tableTop + tableHeaderHeight;
  order.orderedItem.forEach((product) => {
    doc
      .fontSize(10)
      .fillColor("#000000")
      .text(product.productName, 50, position)
      .text(product.productColor, 150, position, { width: 100, align: "left" })
      .text(`${product.price.toFixed(2)}`, 300, position, {
        width: 50,
        align: "right",
      })
      .text(product.quantity, 380, position, { width: 50, align: "right" })
      .text(product.status, 450, position, { width: 50, align: "right" })
      .text(`${product.total.toFixed(2)}`, 520, position, {
        width: 50,
        align: "right",
      });

    position += tableHeaderHeight;
  });

  doc.moveTo(50, position).lineTo(550, position).stroke("#cccccc").moveDown(1);

  position += 10;

  doc
    .fontSize(12)
    .fillColor("#333333")
    .text("Subtotal:", 300, position)
    .text(`${order.totalPrice.toFixed(2)}`, 480, position);

  doc
    .text("Discount:", 300, position + 20)
    .text(`-${order.discount.toFixed(2)}`, 480, position + 20);

  doc
    .text("Delivery Fee:", 300, position + 40)
    .text(`${(order.deliveryCharge || 0).toFixed(2)}`, 480, position + 40);

  doc
    .text("Total Amount:", 300, position + 60)
    .fontSize(16)
    .text(`${order.finalAmount.toFixed(2)}`, 480, position + 60);

  doc
    .moveDown(4)
    .fontSize(10)
    .fillColor("#333333")
    .text("Terms", 50, position + 100)
    .fontSize(8)
    .fillColor("#666666")
    .text("Please make a transfer to:", 50, position + 115)
    .text("Mapple Store", 50, position + 130)
    .text("IBAN: GB23 2344 2334423234423", 50, position + 145)
    .text("BIC: Mapple", 50, position + 160);

  doc
    .moveDown(1)
    .fontSize(10)
    .font("Helvetica-Oblique")
    .fillColor("gray")
    .text(
      "This report was generated by Mapple. All amounts are in INR.",
      50,
      doc.y,
      { align: "center", width: 500 }
    )
    .text("For any queries, contact support@mapple.com.", { align: "center" });

  doc.end();
}

module.exports = {
  loadUserAccount,
  userAccount,
  accountChangePass,
  userAddress,
  getUserAddress,
  addAddress,
  deleteAddress,
  editAddress,
  loadOrders,
  loadOrdersDetails,
  loadFailedOrdersDetails,
  returnProduct,
  cancelProduct,
  productReview,
  loadWishList,
  loadWishListItems,
  removeWishList,
  loadWallet,
  addWishlist,
  loadWalletHistory,
  addMoney,
  loadReferral,
  generateSalesInvoice,
};
