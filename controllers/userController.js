const User = require("../models/userSchema");
const { use } = require("../routes/user/userRoute");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");

const loadHomePage = async (req, res) => {
  try {
    const user = req.session.user;
    const products = await Product.aggregate([
      { $sample: { size: 8 } }, 
    ]);
    if (user) {
      res.render("user/home", { user: user, products });
    } else {
      return res.render("user/home", { products });
    }
  } catch (error) {
    console.log("home Page Not Fount");
    res.status(500).send("Sever error");
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
    console.log("session otp ", req.session.userOtp);

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

      res.json({ success: true, redirectUrl: "/user/login" }); // Absolute URL
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
    req.session.email= email;
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

  try {
    let productDetails = await Product.findOne({ _id: productId });
    // const email = req.session.email

    const products = await Product.aggregate([
      { $sample: { size: 4 } }, 
    ]);

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
    const activeColor = color || currentVariant;
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

    const availableColors = [...new Set(variantColors)]
    // const availableColors = ['#1D2536','#C0C0C0','#C0C0C0']
    // console.log(availableColors);

    res.render("user/productDetails", {
      productDetails,
      availableColors,
      availableVariants,
      activeVariant,
      activeColor,
      products,
    });
  } catch (error) {
    console.error("Error loading product details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const userAccount  = async(req,res)=>{

  res.render("user/userAccount")

}




const pageNotFount = async (req, res) => {
  try {
    res.render("user/pageNotFount");
  } catch (error) {
    res.redirect("/pageNotFount");
  }
};

module.exports = {
  loadHomePage,
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

  userAccount,

  loadProductDetails,
};
