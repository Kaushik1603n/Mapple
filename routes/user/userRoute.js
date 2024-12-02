const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const passport = require("passport");


router.get("/pageNotFount",userController.pageNotFount)

router.get("/", userController.loadHomePage);
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verificationOTP", userController.verifyOTP);
router.post("/resendOTP", userController.resendOTP);
router.get("/login", userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);


router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),
  (req, res) => {
    res.redirect("/user");
  }
);

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
// router.get("/pageNotFount", (req, res) => {
//   res.render("user/pageNotFount");
// });
// router.get("/changePass", (req, res) => {
//   res.render("user/changePass");
// });

module.exports = router;
