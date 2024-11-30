const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");


// router.get("/login", auth.isLogin, userController.loadLogin);
// router.post("/login", userController.login);



router.get("/login", (req, res) => {
  res.render("user/login");
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
router.get("/forgotPassword", (req, res) => {
  res.render("user/forgotPassword");
});
router.get("/otp", (req, res) => {
  res.render("user/verificationOTP");
});
router.get("/changePass", (req, res) => {
  res.render("user/changePass");
});

module.exports = router;
