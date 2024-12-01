const User = require("../models/userSchema");
const { use } = require("../routes/user/userRoute");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");

const loadHomePage = async (req, res) => {
  try {
    return res.render("user/home");
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

// const signup = async (req, res) => {
//   const { name, email, password } = req.body; // Extract googleID properly
//   try {
//     const newUser U new user({
//       name,
//       email,
//       password,
//       // googleID: googleID || undefined, // Include googleID only if provided
//     });
//     await newUser.save();
//     return res.redirect("/user/signup");
//   } catch (error) {
//     if (error.code === 11000 && error.keyPattern && error.keyPattern.googleID) {
//       // Detect duplicate key error for googleID
//       console.error("Duplicate Google ID error");
//       return res.status(400).send("Duplicate Google ID error");
//     }
//     console.error("Error saving user:", error);
//     res.status(500).send("Internal server error");
//   }
// };

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
    req.session.userData = { name, email, password };

    res.render("user/verificationOTP");
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
      req.session.user = saveUserData._id;

      res.json({ success: true, redirectUrl: "/user/login" }); // Absolute URL
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const resendOTP = async (req,res)=>{
  try {
    const {email} = req.session.userData;
    if(!email){
      return res.status(400).json({success:false,message:"Email not fount in session"})
    }
    const otp = generateOtp();
    req.session.userOtp=otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if(emailSent){
      console.log("Resend OTP: ",otp);
      res.status(200).json({success:true,message:"OTP Ressent Successfully"})
    }else{
      res.status(500).json({success:false,message:"failed to resend OTP try again"})
    }
  } catch (error) {
    console.error("Error resending OTP",error)
    res.status(500).json({success:false,message:"Internal Sever Error Try again"})
  }
}


module.exports = {
  loadHomePage,
  loadSignup,
  signup,
  verifyOTP,
  resendOTP,
};
