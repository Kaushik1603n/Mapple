const User = require("../models/userSchema");
const { use } = require("../routes/user/userRoute");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const address = require("../models/addressSchema");
const cart = require("../models/cartSchema");
const order = require("../models/orderSchema");
const { log } = require("console");
const { render } = require("ejs");

const loadHomePage = async (req, res) => {
  try {
    const user = req.session.user;
    // const products = await Product.aggregate([{ $sample: { size: 8 } }]);

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

    // console.log(categories);

    //   const productss = await Product.find()
    // .populate({
    //   path: "category",
    //   match: { status: true }
    // })
    // .limit(8)
    // console.log(productss);

    if (user) {
      res.render("user/home", {
        user: user,
        products: products,
        categories: categories,
      });
    } else {
      return res.render("user/home", { products, categories: categories });
    }
  } catch (error) {
    console.log("home Page Not Fount", error);
    res.status(500).send("Sever error");
  }
};

const loadShope = async (req, res) => {
  const user = req.session.user;
  try {
    const { search, variant, sortOption, priceRange } = req.query; // Get search query and variant from the URL
    let filter = {}; // Initialize filter

    if (search) {
      filter = {
        $or: [
          { productName: new RegExp(search, "i") },
          { processor: new RegExp(search, "i") },
        ],
      };
    }

    if (variant) {
      if (Array.isArray(variant)) {
        filter.variant = { $in: variant };
      } else {
        filter.variant = variant;
      }
    }

    if (priceRange) {
      const ranges = Array.isArray(priceRange) ? priceRange : [priceRange];

      // Parse price ranges into filter conditions
      const priceConditions = ranges.map((range) => {
        const [min, max] = range.split("-").map(Number); // Convert "50k-75k" to [50000, 75000]
        return { salePrice: { $gte: min, $lte: max } }; // Assuming prices are in thousands
      });

      // Combine price conditions with $or
      filter.$or = [...(filter.$or || []), ...priceConditions];
      // console.log(priceConditions);
    }

    let sort = {};
    if (sortOption === "lowToHigh") {
      sort = { salePrice: 1 };
    } else if (sortOption === "highToLow") {
      sort = { salePrice: -1 };
    } else if (sortOption === "aToZ") {
      sort = { productName: -1 };
    } else if (sortOption === "zToA") {
      sort = { productName: 1 };
    } else {
      sort = { createdAt: -1 };
    }
    // console.log(priceRange);

    const allProduct = await Product.find(filter)
      .populate("category")
      .sort(sort);

    if (user) {
      res.render("user/shop", {
        user: user,
        allProduct: allProduct,
        variant: variant || [],
        search,
        sortOption: sortOption || {},
        priceRange: priceRange || [],
      });
    } else {
      res.render("user/shop", {
        allProduct: allProduct,
        variant: variant || [],
        search,
        sortOption: sortOption || {},
        priceRange: priceRange || [],
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
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
    const { name, email, password, cpassword } = req.body;

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
    // console.log("session otp ", req.session.userOtp);

    req.session.userData = { name, email, password };

    // req.session.registerUser=true;
    res.redirect("/user/verificationOTP");
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
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        password: passwordHash,
      });

      await saveUserData.save();
      req.session.user = saveUserData;

      res.json({ success: true, redirectUrl: "/user/login" });
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
      res.redirect("/user");
    }
  } catch (error) {
    res.redirect("/user/pageNotFount");
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
    res.redirect("/user");
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
      return res.redirect("/user");
    } else {
      res.render("user/forgotPassword");
    }
  } catch (error) {}
};

const forgotPassword = async (req, res) => {
  if (req.session.user) {
    return res.redirect("/user");
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

    res.redirect("/user/changePassword");
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
      return res.redirect("/user");
    }
    // if (!req.session.emailVerify) {
    //   return res.redirect("/user");
    // }

    const email = req.session.emailVerify;
    if (!email) {
      return res.redirect("/user/forgotPassword");
    }

    res.render("user/changePassword", { email });
  } catch (error) {
    console.error("Error loading Change Password page:", error);
    res.status(500).send("An error occurred while loading the page.");
  }
};

const changePass = async (req, res) => {
  try {
    const email = req.session.emailVerify; // Get email from session
    if (!email) {
      return res.redirect("/user/forgotPassword"); // Redirect if session expired or invalid
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

    res.redirect("/user/login");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("An error occurred while updating the password.");
  }
};

const googleLogin = async (req, res) => {
  try {
    req.session.user = req.user;
    // console.log(req.user.name);

    res.redirect("/user");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error", err);
        return res.redirect("/user/pageNotFount");
      }
      return res.redirect("/user/login");
    });
  } catch (error) {
    console.log("Logout Error", error);
    res.redirect("/user/pageNotFount");
  }
};

const loadProductDetails = async (req, res) => {
  const { productId } = req.params;
  const { color, variant } = req.query;
  const user = req.session.user;

  try {
    let productDetails = await Product.findOne({ _id: productId });
    // const email = req.session.email

    const products = await Product.aggregate([{ $sample: { size: 4 } }]);

    if (!productDetails) {
      return res.status(400).json({ message: "Product not found" });
    }

    const currentVariant = productDetails.variant;
    const currentColor = productDetails.color;

    const relatedProducts = await Product.find({
      productName: productDetails.productName,
    });

    const variantColors = relatedProducts
      .filter((product) => product.variant === (variant || currentVariant))
      .map((product) => product.color);

    const activeVariant = variant || currentVariant;
    const activeColor = color || currentColor;
    // console.log(activeVariant);

    if (color || variant) {
      const filteredProduct = relatedProducts.find((product) => {
        return (
          (!color || product.color === color) &&
          (!variant || product.variant === variant)
        );
      });

      if (filteredProduct) {
        productDetails = filteredProduct;
      }
    }

    const availableVariants = [
      ...new Set(relatedProducts.map((product) => product.variant)),
    ];

    const availableColors = [...new Set(variantColors)];
    // const availableColors = ['#1D2536','#C0C0C0','#C0C0C0']
    // console.log(availableColors);

    res.render("user/productDetails", {
      productDetails,
      availableColors,
      availableVariants,
      activeVariant,
      activeColor,
      products,
      user,
    });
  } catch (error) {
    console.error("Error loading product details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loadUserAccount = async (req, res) => {
  // const { id } = req.params;
  const userData = req.session.user;
  // console.log(userData);
  if (!req.session.user) {
    return res.redirect("/user/login");
  }
  try {
    const findUser = await User.findById(userData._id);
    // console.log(findUser);

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
      _id: { $ne: findUser._id }, // Exclude the current user's _id from this check
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
    // console.log(userAddress);

    return res.render("user/address", {
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

    // console.log(addressLimit);

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
    // console.log("hello", addressId);
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
    const orderedItem = await order.find({ userId });
    // console.log(orderedItem);

    res.render("user/orders", { orders: orderedItem || [] });
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
    // console.log(orderDetails);

    res.render("user/orderDetails", { orderDetails: orderDetails || [] });
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
    // console.log(result);

    res.json({
      success: "Your Cancel request has been sent to the admin for review.",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Failed to send the request." });
  }
};

const addCart = async (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ success: false, message: "Login first" });
  }
  try {
    const { productId, quantity } = req.body;

    // console.lo-g(req.body);

    if (!productId || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const userData = req.session.user;
    const userId = userData._id;
    // console.log(userId);

    let userCart = await cart.findOne({ userId: userId });
    if (!userCart) {
      userCart = new cart({ userId: userId, items: [] });
    }

    const existingItem = userCart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      // Update the quantity and total price for the existing item
      existingItem.quantity += quantity;
      existingItem.totalprice = existingItem.quantity * existingItem.price;
    } else {
      // If product is not in the cart, add it
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      userCart.items.push({
        productId: productId,
        quantity: quantity,
        price: product.salePrice,
        totalprice: product.salePrice * quantity,
      });
    }

    // Recalculate the cart's total amount
    userCart.totalAmount = userCart.items.reduce(
      (sum, item) => sum + item.totalprice,
      0
    );

    // Save the updated cart
    await userCart.save();

    // Send success response
    return res
      .status(200)
      .json({ success: true, message: "Product added to cart" });
  } catch (error) {
    console.error("Error in addCart:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const loadAddCart = async (req, res) => {
  const userData = req.session.user;
  if (!req.session.user) {
    return res.redirect("/user/login");
  }
  try {
    const userId = userData._id;
    // const cartItems = await cart.findOne({ userId: userId });
    // // console.log(cartItems);
    // const items = cartItems.items;
    const userCart = await cart.findOne({ userId }).populate("items.productId");

    res.render("user/cart", { userCart: userCart || [] });
  } catch (error) {}
};

const removeCartItem = async (req, res) => {
  const { id } = req.params;
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const cartItems = await cart
      .findOne({ userId })
      .populate("items.productId");
    // console.log(cartItems);
    const updatedItems = cartItems.items.filter(
      (item) => item._id.toString() !== id
    );
    // console.log(updatedItems);

    cartItems.items = updatedItems;
    await cartItems.save();

    res.status(200).json({ message: "Item removed successfully" });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Error removing item from cart" });
  }
};

const updatequantity = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const { itemId, action } = req.body;
    const cartItems = await cart.findOne({ userId: userId });

    const item = cartItems.items.find((item) => item._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    const product = await Product.findById(item.productId);

    if (action === "increment" && item.quantity >= product.quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    if (action === "increment") {
      item.quantity += 1;
    } else if (action === "decrement" && item.quantity > 1) {
      item.quantity -= 1;
    } else {
      return res
        .status(400)
        .json({ message: "Quantity cannot be less than 1" });
    }

    // Save the cart
    await cartItems.save();

    return res.status(200).json({ quantity: item.quantity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating quantity" });
  }
};

const loadCheckout = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    let userAddress = await address.findOne({ userId: userId });
    // console.log(userAddress);
    const userCart = await cart.findOne({ userId });
    // console.log(userCart);

    res.render("user/checkOut", { userAddress, userCart });
  } catch (error) {}
};

const placeOrder = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const {
      orderedItem,
      deliveryAddress,
      billingDetails,
      paymentMethod,
      status,
      couponApplied,
    } = req.body;

    // console.log(orderedItem);

    if (!orderedItem || orderedItem.length === 0) {
      return res.status(400).json({ error: "Ordered items are required." });
    }
    if (!deliveryAddress || !billingDetails || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required." });
    }
    let finalAmount = 0;
    let totalPrice = 0;
    const orderedProduct = [];
    for (const item of orderedItem) {
      const product = await Product.findById(item.product);
      if (!product) {
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
        price: item.price,
        total: item.quantity * item.price,
      });
    }
    const orderId = ` ORD${Date.now()}`;
    const newOrder = await order.create({
      orderId: orderId,
      userId: userId,
      orderedItem: orderedProduct,
      totalPrice,
      discount: totalPrice - finalAmount,
      finalAmount,
      deliveryAddress: deliveryAddress,
      billingDetails: billingDetails,
      invoiceDate: new Date(),
      status: status,
      couponApplied: couponApplied || false,
      paymentMethod,
    });

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
        // If quantity reaches 0, set the status to "out of stock"
        await Product.findByIdAndUpdate(item.product, {
          $set: { status: "Out of stock" },
        });
        console.log(`Product ${item.product} is now out of stock.`);
      }
      // console.log(updatedProduct);
    }

    await cart.findOneAndDelete({ userId: userId });

    // console.log("success");
    res.status(404).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    // throw err;
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

  loadUserAccount,
  userAccount,
  accountChangePass,
  userAddress,
  addAddress,
  deleteAddress,
  editAddress,
  loadOrders,
  loadOrdersDetails,
  returnProduct,
  cancelProduct,

  loadProductDetails,
  addCart,
  loadAddCart,
  removeCartItem,
  updatequantity,

  loadCheckout,
  placeOrder,
};
