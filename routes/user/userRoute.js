const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const passport = require("passport");
const auth = require("../../middlewares/auth");

router.get("/pageNotFount", userController.pageNotFount);

router.get("/", userController.loadHomePage);
router.get("/signup", auth.isLogin, userController.loadSignup);
router.post("/signup", userController.signup);
router.get("/verificationOTP", auth.isLogin, userController.loadVerifyOTP);
router.post("/verificationOTP", userController.verifyOTP);
router.post("/resendOTP", userController.resendOTP);
router.get("/login", auth.isLogin, userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),
    userController.googleLogin
  // (req, res) => {
  //   req.session.user = true;
  //   res.redirect("/user");
  // }
);

// router.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );
// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/user/signUp" }),
//   userMiddleWare.storeSessionEmail,
//   userController.googleLogin
// );

module.exports = router;
