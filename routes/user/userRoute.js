const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const passport = require("passport");
const auth = require("../../middlewares/auth");
const { render } = require("ejs");

router.get("/pageNotFount", userController.pageNotFount);

router.get("/", userController.loadHomePage);
router.get("/shop" ,userController.loadShope);
router.get("/signup", auth.isLogin, userController.loadSignup);
router.post("/signup", userController.signup);
router.get("/verificationOTP", auth.isLogin, userController.loadVerifyOTP);
router.post("/verificationOTP", userController.verifyOTP);
router.post("/resendOTP", userController.resendOTP);
router.get("/login", auth.isLogin, userController.loadLogin);
router.post("/login", userController.login);
router.get("/forgotPassword", userController.loadforgotPassword);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/otpValidation", userController.otpValidation);
router.post("/otpResend", userController.OtpResend);
router.get("/changePassword", userController.loadChangePass);
router.post("/changePassword", userController.changePass);
router.get("/logout", userController.logout);


router.get("/productDetails/:productId", userController.loadProductDetails);

router.get("/account",auth.userAuth , userController.loadUserAccount);
router.post("/account", userController.userAccount);
router.post("/accountChangePass", userController.accountChangePass);
router.get("/address",auth.userAuth, userController.userAddress);
router.post("/addAddress", userController.addAddress);
router.delete("/address/delete/:id", userController.deleteAddress);
router.put("/address/edit/:id", userController.editAddress);
router.get("/orders",auth.userAuth, userController.loadOrders);
router.get("/orderDetails/:id",auth.userAuth, userController.loadOrdersDetails);
router.post("/returnProduct", userController.returnProduct);
router.post("/cancelProduct", userController.cancelProduct);
router.post("/productReview", userController.productReview);
router.post("/wishlist", userController.addWishlist);
router.get("/wishlist", userController.loadWishList);
router.delete("/removeproduct/:id", userController.removeWishList);
router.get("/wallet", userController.loadWallet);
router.post("/addmoney", userController.addMoney);

router.post("/cart", userController.addCart);
router.get("/cart",auth.userAuth, userController.loadAddCart);
router.delete("/cart/remove/:id", userController.removeCartItem);
router.post("/cart/update-quantity", userController.updatequantity);

router.get("/checkout",auth.userAuth, userController.loadCheckout);
router.post("/placeOrder",auth.userAuth, userController.placeOrder);
router.post("/verify-payment",auth.userAuth, userController.verifyPayment);
router.post("/applyCoupon",auth.userAuth, userController.applyCoupon);
router.post("/removeCoupon",auth.userAuth, userController.removeCoupon);


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
