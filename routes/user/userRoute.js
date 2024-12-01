const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");

router.get("/",userController.loadHomePage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.post("/verificationOTP", userController.verifyOTP)
router.post("/resendOTP", userController.resendOTP)

router.get("/login", (req, res) => {
  res.render("user/login");
  
});
// router.get("/signup", (req, res) => {
//   res.render("user/signup");
// });
// router.get("/forgotPassword", (req, res) => {
//   res.render("user/forgotPassword");
// });
router.get("/resendOTP", (req, res) => {
  res.render("user/verificationOTP");
});
// router.get("/changePass", (req, res) => {
//   res.render("user/changePass");
// });

module.exports = router;
