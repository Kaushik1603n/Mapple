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


router.get("/productDetails/:productId",auth.userAuth, userController.loadProductDetails);

router.get("/account",auth.userAuth , userController.loadUserAccount);
router.post("/account",auth.userAuth, userController.userAccount);
router.post("/accountChangePass", auth.userAuth,userController.accountChangePass);
router.get("/address",auth.userAuth, userController.userAddress);
router.get("/userAddress",auth.userAuth, userController.getUserAddress);
router.post("/addAddress",auth.userAuth, userController.addAddress);
router.delete("/address/delete/:id",auth.userAuth, userController.deleteAddress);
router.put("/address/edit/:id",auth.userAuth, userController.editAddress);
router.get("/orders",auth.userAuth, userController.loadOrders);
router.get("/orderDetails/:id",auth.userAuth, userController.loadOrdersDetails);
router.get("/failedOrderDetails/:id",auth.userAuth, userController.loadFailedOrdersDetails);
router.post("/returnProduct",auth.userAuth, userController.returnProduct);
router.post("/cancelProduct",auth.userAuth, userController.cancelProduct);
router.post("/productReview",auth.userAuth, userController.productReview);
router.post("/wishlist", auth.userAuth,userController.addWishlist);
router.get("/wishlist",auth.userAuth, userController.loadWishList);
router.get("/wishlistItems",auth.userAuth, userController.loadWishListItems);
router.delete("/removeproduct/:id", auth.userAuth,userController.removeWishList);
router.get("/wallet",auth.userAuth, userController.loadWallet);
router.get("/transaction",auth.userAuth, userController.loadWalletHistory);
router.post("/addmoney",auth.userAuth, userController.addMoney);
router.get("/referral",auth.userAuth, userController.loadReferral);

router.post("/cart", auth.userAuth,userController.addCart);
router.get("/cart",auth.userAuth, userController.loadAddCart);
router.delete("/cart/remove/:id",auth.userAuth, userController.removeCartItem);
router.post("/cart/update-quantity",auth.userAuth, userController.updatequantity);

router.get("/checkout",auth.userAuth, userController.loadCheckout);
router.post("/placeOrder",auth.userAuth, userController.placeOrder);
router.post("/verify-payment",auth.userAuth, userController.verifyPayment);
router.get("/payment-failed",auth.userAuth, userController.paymentFailed);
router.post("/retry-payment",auth.userAuth, userController.retryPayment);
router.post("/update-order-status",auth.userAuth, userController.updateOrder);
router.post("/applyCoupon",auth.userAuth, userController.applyCoupon);
router.post("/removeCoupon",auth.userAuth, userController.removeCoupon);
router.get("/downloadInvoice/:orderId",auth.userAuth, userController.generateSalesInvoice);


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
