const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const userAccount = require("../../controllers/user/userAccount");
const userCart = require("../../controllers/user/userCart");
const userPlaceOrder = require("../../controllers/user/userPlaceOrder");
const passport = require("passport");
const auth = require("../../middlewares/auth");
// const { render } = require("ejs");

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


router.get("/productDetails/:productId",auth.userAuth, userCart.loadProductDetails);
router.post("/cart", auth.userAuth,userCart.addCart);
router.get("/cart",auth.userAuth, userCart.loadAddCart);
router.delete("/cart/remove/:id",auth.userAuth, userCart.removeCartItem);
router.post("/cart/update-quantity",auth.userAuth, userCart.updatequantity);

router.get("/account",auth.userAuth , userAccount.loadUserAccount);
router.post("/account",auth.userAuth, userAccount.userAccount);
router.post("/accountChangePass", auth.userAuth,userAccount.accountChangePass);
router.get("/address",auth.userAuth, userAccount.userAddress);
router.get("/userAddress",auth.userAuth, userAccount.getUserAddress);
router.post("/addAddress",auth.userAuth, userAccount.addAddress);
router.delete("/address/delete/:id",auth.userAuth, userAccount.deleteAddress);
router.put("/address/edit/:id",auth.userAuth, userAccount.editAddress);
router.get("/orders",auth.userAuth, userAccount.loadOrders);
router.get("/orderDetails/:id",auth.userAuth, userAccount.loadOrdersDetails);
router.get("/failedOrderDetails/:id",auth.userAuth, userAccount.loadFailedOrdersDetails);
router.post("/returnProduct",auth.userAuth, userAccount.returnProduct);
router.post("/cancelProduct",auth.userAuth, userAccount.cancelProduct);
router.post("/productReview",auth.userAuth, userAccount.productReview);
router.post("/wishlist", auth.userAuth,userAccount.addWishlist);
router.get("/wishlist",auth.userAuth, userAccount.loadWishList);
router.get("/wishlistItems",auth.userAuth, userAccount.loadWishListItems);
router.delete("/removeproduct/:id", auth.userAuth,userAccount.removeWishList);
router.get("/wallet",auth.userAuth, userAccount.loadWallet);
router.get("/transaction",auth.userAuth, userAccount.loadWalletHistory);
router.post("/addmoney",auth.userAuth, userAccount.addMoney);
router.get("/referral",auth.userAuth, userAccount.loadReferral);
router.get("/downloadInvoice/:orderId",auth.userAuth, userAccount.generateSalesInvoice);


router.get("/checkout",auth.userAuth, userPlaceOrder.loadCheckout);
router.post("/placeOrder",auth.userAuth, userPlaceOrder.placeOrder);
router.post("/verify-payment",auth.userAuth, userPlaceOrder.verifyPayment);
router.get("/payment-failed",auth.userAuth, userPlaceOrder.paymentFailed);
router.post("/retry-payment",auth.userAuth, userPlaceOrder.retryPayment);
router.post("/update-order-status",auth.userAuth, userPlaceOrder.updateOrder);
router.post("/applyCoupon",auth.userAuth, userPlaceOrder.applyCoupon);
router.post("/removeCoupon",auth.userAuth, userPlaceOrder.removeCoupon);


router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),
    userController.googleLogin
);



module.exports = router;
