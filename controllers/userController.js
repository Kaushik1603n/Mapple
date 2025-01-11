const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const address = require("../models/addressSchema");
const cart = require("../models/cartSchema");
const order = require("../models/orderSchema");
const Review = require("../models/reviewSchema");
const { log, error } = require("console");
const { render } = require("ejs");
const wishlist = require("../models/wishlistSchema");
const Wallet = require("../models/walletSchema");
const coupon = require("../models/couponSchema");
const Razorpay = require("razorpay");
const Offer = require("../models/offerSchema");
const Referral = require("../models/referralSchema");
const failedorder = require("../models/faildOrders");
const PDFDocument = require("pdfkit");
const categoty = require("../models/categorySchema");

const loadHomePage = async (req, res) => {
  try {
    const user = req.session.user;

    const products = await Product.aggregate([
      { $sample: { size: 8 } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $addFields: {
          categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] },
        },
      },
      {
        $match: {
          "categoryDetails.status": true,
        },
      },
    ]);

    const productCategories = await Product.find().populate({
      path: "category",
      match: { status: true },
    });

    const uniqueCategories = {};

    productCategories.forEach((product) => {
      if (product.category && product.category.name) {
        const categoryName = product.category.name;

        if (!uniqueCategories[categoryName]) {
          uniqueCategories[categoryName] = product.productImage[0];
        }
      }
    });

    const categories = Object.entries(uniqueCategories).map(
      ([categoryName, productImage]) => ({
        categoryName,
        productImage,
      })
    );

    if (user) {
      const wishlistItems = await wishlist.find({ userId: user._id });

      res.render("user/home", {
        user: user,
        products: products,
        categories: categories,
        wishlistItems: wishlistItems || [],
      });
    } else {
      return res.render("user/home", {
        products,
        categories: categories,
        wishlistItems: [],
      });
    }
  } catch (error) {
    console.log("home Page Not Fount", error);
    res.status(500).send("Sever error");
  }
};

const loadShope = async (req, res) => {
  const user = req.session.user;
  try {
    if (user) {
      res.render("user/shop", {
        user: user,
      });
    } else {
      res.render("user/shop");
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};

const shopData = async (req, res) => {
  const {
    search,
    sortOption,
    page = 1,
    variant = [],
    category = [],
    priceRange = [],
  } = req.query;
  const ITEMS_PER_PAGE = 8;
  // console.log(req.query);

  const query = {};
  if (search) query.productName = { $regex: search, $options: "i" }; // Case-insensitive search
  if (variant) {
    const variantFilter = Array.isArray(variant)
      ? variant
      : variant.split(",").map((item) => item.trim());
    if (variantFilter.length) {
      query.variant = { $in: variantFilter };
    }
  }
  let categoryFilter = {};
  if (category && category.length) {
    const categoryArray = Array.isArray(category)
      ? category
      : category.split(",").map((item) => item.trim());

    if (categoryArray.length) {
      categoryFilter.name = {
        $in: categoryArray.map((item) => new RegExp(item, "i")),
      };
    }
  }

  if (priceRange) {
    const ranges = priceRange
      .split(",")
      .map((range) => range.split("-").map(Number));

    if (ranges.length === 1) {
      const [min, max] = ranges[0];
      query.salePrice = { $gte: min, $lte: max };
    } else {
      query.$or = ranges.map(([min, max]) => ({
        salePrice: { $gte: min, $lte: max },
      }));
    }
  }

  // console.log(query);

  const sortOptions = {
    lowToHigh: { salePrice: 1 },
    highToLow: { salePrice: -1 },
    aToZ: { productName: -1 },
    zToA: { productName: 1 },
  };

  const productsQuery = await Product.find(query)
    .populate({
      path: "category",
      match: Object.keys(categoryFilter).length ? categoryFilter : undefined, // Apply match only if categoryFilter has conditions
    })
    .sort(sortOptions[sortOption] || { createdAt: -1 })
    .skip((page - 1) * ITEMS_PER_PAGE)
    // .limit(ITEMS_PER_PAGE);

  const products = await productsQuery;

  const filteredProducts = Object.keys(categoryFilter).length
    ? products.filter((product) => product.category)
    : products;

  const totalFilteredProducts = Object.keys(categoryFilter).length
    ? await Product.countDocuments({
        ...query,
        category: { $in: await categoty.find(categoryFilter).select("_id") },
      })
    : await Product.countDocuments(query);

  const totalPages = Math.ceil(totalFilteredProducts / ITEMS_PER_PAGE);

  const limitedProduct =filteredProducts.slice(0, 8)
  // console.log(filteredProducts);
  

  res.json({
    products: limitedProduct,
    currentPage: page,
    totalPages,
    totalProducts: totalFilteredProducts,
  });
};

const loadSignup = async (req, res) => {
  try {
    return res.render("user/signup");
  } catch (error) {
    console.log("Signup Page Not Fount");
    res.status(500).send("Sever error");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verification OTP",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.log("Error sending Email", error);
    return false;
  }
}

const signup = async (req, res) => {
  try {
    const { name, email, password, cpassword, referral } = req.body;

    if (password !== cpassword) {
      return res.render("user/signup", { message: "Password do not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("user/signup", { message: "User already exists" });
    }

    const otp = generateOtp();

    const emailsent = await sendVerificationEmail(email, otp);
    if (!emailsent) {
      return res.json("email-error");
    }
    req.session.userOtp = otp;

    req.session.userData = { name, email, password, referral };
    console.log(req.session.userData);
    console.log(referral);

    // req.session.registerUser=true;
    res.redirect("/verificationOTP");
    console.log("signUp verification OTP is: ", otp);
  } catch (error) {
    console.error("signUp error", error);
    res.send("/pageNotFount");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};

const loadVerifyOTP = async (req, res) => {
  try {
    return res.render("user/verificationOTP");
  } catch (error) {}
};

const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("Received OTP:", otp);
    console.log("Expected OTP:", req.session.userOtp);

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const referral = user.referral;
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        password: passwordHash,
      });

      await saveUserData.save();
      req.session.user = saveUserData;

      const findReferral = await User.findOne({ referralCode: user.referral });
      if (!findReferral) {
        console.log("Referral code not available in DB");
      } else {
        const existReferral = await Referral.findOne({ userEmail: user.email });

        if (!existReferral) {
          const addReferral = await Referral.create({
            userId: saveUserData._id,
            userEmail: saveUserData.email,
            referralCode: referral,
            referredUsers: findReferral._id,
          });

          const findOwner = await User.findOneAndUpdate(
            { _id: findReferral._id }, // Find the referrer
            { $push: { referredUsers: saveUserData._id } }, // Add the new user to referredUsers array
            { new: true }
          );

          console.log("Referral successfully added:", addReferral);
        } else {
          console.log("Referral already exists for this user.");
        }
      }

      res.json({ success: true, redirectUrl: "/" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not fount in session" });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resend OTP: ", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP Ressent Successfully" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "failed to resend OTP try again" });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Sever Error Try again" });
  }
};

const loadLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("user/login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("/pageNotFount");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    req.session.email = email;
    const findUser = await User.findOne({ email: email });

    if (!findUser) {
      return res.render("user/login", { message: "User Not Found" });
    }
    if (findUser.isBlock) {
      return res.render("user/login", { message: "User is blocked by Admin" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("user/login", { message: "Incorrect Password" });
    }

    req.session.user = findUser;
    res.redirect("/");
  } catch (error) {
    console.error("Login error", error);
    res.render("user/login", {
      message: "login failed. Pease try again later",
    });
  }
};

const loadforgotPassword = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/");
    } else {
      res.render("user/forgotPassword");
    }
  } catch (error) {}
};

const forgotPassword = async (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  try {
    const { email } = req.body;
    req.session.emailVerify = email;
    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.render("user/forgotPassword", { message: "User not exists" });
    }

    const otp = generateOtp();
    const expirationTime = Date.now() + 15 * 60 * 1000;

    findUser.resetToken = otp;
    findUser.resetTokenExpiry = expirationTime;

    await findUser.save();

    const emailsent = await sendVerificationEmail(email, otp);
    if (!emailsent) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    console.log("session otp ", req.session.userOtp);

    res.render("user/otpValidation", { email });
  } catch (error) {}
};

const otpValidation = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res.status(400).send("User not found");
    }

    if (findUser.resetToken !== otp) {
      return res.status(400).send("Invalid OTP");
    }

    if (findUser.resetTokenExpiry < Date.now()) {
      return res.status(400).send("OTP has expired");
    }
    console.log("OTP verified successfully");
    req.session.emailVerify = email;

    findUser.resetToken = undefined;
    findUser.resetTokenExpiry = undefined;
    await findUser.save();

    res.redirect("/changePassword");
  } catch (error) {
    console.log("error on catch");
  }
};
const OtpResend = async (req, res) => {
  try {
    const email = req.session.emailVerify;
    if (!email) {
      console.log("email not found");

      return res
        .status(400)
        .json({ success: false, message: "Email not fount in session" });
    }

    const findUser = await User.findOne({ email });
    if (!findUser) {
      console.log("user not found");
      return res.render("user/forgotPassword", { message: "User not exists" });
    }

    const otp = generateOtp();
    const expirationTime = Date.now() + 15 * 60 * 1000;

    findUser.resetToken = otp;
    findUser.resetTokenExpiry = expirationTime;

    await findUser.save();

    req.session.userOtp = otp;
    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resend OTP: ", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP Ressent Successfully" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "failed to resend OTP try again" });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Sever Error Try again" });
  }
};

const loadChangePass = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/");
    }

    const email = req.session.emailVerify;
    if (!email) {
      return res.redirect("/forgotPassword");
    }

    res.render("user/changePassword", { email });
  } catch (error) {
    console.error("Error loading Change Password page:", error);
    res.status(500).send("An error occurred while loading the page.");
  }
};

const changePass = async (req, res) => {
  try {
    const email = req.session.emailVerify;
    if (!email) {
      return res.redirect("/forgotPassword");
    }

    const { password } = req.body;

    const passwordHash = await securePassword(password);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.password = passwordHash;
    await user.save();

    req.session.emailVerify = null;

    res.redirect("/login");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("An error occurred while updating the password.");
  }
};

const googleLogin = async (req, res) => {
  try {
    req.session.user = req.user;

    res.redirect("/");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error", err);
        return res.redirect("/pageNotFount");
      }
      return res.redirect("/login");
    });
  } catch (error) {
    console.log("Logout Error", error);
    res.redirect("/pageNotFount");
  }
};

const pageNotFount = async (req, res) => {
  try {
    res.render("user/pageNotFount");
  } catch (error) {
    res.redirect("/pageNotFount");
  }
};

module.exports = {
  loadHomePage,
  loadShope,
  shopData,
  loadSignup,
  signup,
  loadVerifyOTP,
  verifyOTP,
  resendOTP,
  loadLogin,
  pageNotFount,
  login,
  googleLogin,
  loadforgotPassword,
  forgotPassword,
  otpValidation,
  OtpResend,
  loadChangePass,
  changePass,
  logout,
};
