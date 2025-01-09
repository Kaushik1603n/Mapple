const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const productController = require("../../controllers/admin/productCondroller");
const categoryController = require("../../controllers/admin/categoryController");
const couponController = require("../../controllers/admin/couponController");
const orderController = require("../../controllers/admin/orderController");
const offerController = require("../../controllers/admin/offerController");
const customerController = require("../../controllers/admin/customerController");
const dashboardController = require("../../controllers/admin/dashboardController");
const {userAuth,adminAuth,checkAdminAuth} = require("../../middlewares/auth")

router.get("/pageerror",adminController.pageerror)
router.get("/login", adminController.loadLogin);
router.post("/login",adminAuth, adminController.login);

router.get("/dashboard",checkAdminAuth,dashboardController.loadDashboard)
router.get("/sales-data",checkAdminAuth,dashboardController.salesData)
router.get("/discount-data",checkAdminAuth,dashboardController.discountDdata)
router.get("/ledger-data",checkAdminAuth,dashboardController.ledgerData)

router.get("/customer",checkAdminAuth,customerController.loadCustomer)
router.put('/update-customer-status/:userId',checkAdminAuth,customerController.updateCustomerStatus)
router.delete('/deleteCustomer/:id', checkAdminAuth,customerController.deleteCustomer);
router.get('/addCustomer', checkAdminAuth,customerController.loadAddCustomer);
router.post('/addCustomer', checkAdminAuth,customerController.addCustomer);
router.get('/updateCustomer/:id', checkAdminAuth,customerController.loadUpdateCustomer);
router.get('/updateCustomerDetails/:id', checkAdminAuth,customerController.loadUpdateCustomerPage);
router.post('/updateCustomer', checkAdminAuth,customerController.updateCustomer);

router.get("/category",checkAdminAuth,categoryController.loadcategory)
router.get("/addCategory",checkAdminAuth,categoryController.loadAddCategory)
router.post("/addCategory",checkAdminAuth,categoryController.addCategory)
router.get("/editCategory/:id",checkAdminAuth,categoryController.loadEditCategory)
router.post("/editCategory",checkAdminAuth,categoryController.editCategory)
router.patch("/updateCategoryStatus/:id",checkAdminAuth,categoryController.editCategoryStatus)
router.delete("/deleteCategory/:id",checkAdminAuth,categoryController.deleteCategory)

router.get("/products",checkAdminAuth,productController.loadproducts)
router.get("/addProduct",checkAdminAuth,productController.loadAddProducts)
router.post("/addProduct",checkAdminAuth,productController.uploadImages,productController.addProducts)
router.get("/updateProduct/:id",checkAdminAuth,productController.loadUpdateProduct)
router.put("/updateProduct",checkAdminAuth,productController.uploadImages,productController.updateProduct)
router.patch("/updateProductStatus/:id",checkAdminAuth,productController.editProductStatus)
router.delete("/deleteProductImage/:productId",checkAdminAuth,productController.deleteProductImage)
router.delete("/deleteProduct/:id",checkAdminAuth,productController.deleteProduct)

router.get("/coupon",checkAdminAuth,couponController.loadCoupon)
router.get("/getAllCoupon",checkAdminAuth,couponController.getAllCoupon)
router.get("/addCoupon",checkAdminAuth,couponController.loadAddCoupon)
router.post("/addcoupon",checkAdminAuth,couponController.addCoupon)
router.get("/updateCoupon/:id",checkAdminAuth,couponController.loadUpdateCoupon)
router.post("/updatecoupon",checkAdminAuth,couponController.updateCoupon)
router.delete("/deleteCoupon/:id",checkAdminAuth,couponController.deleteCoupon)
router.put("/update-Coupon-status/:id",checkAdminAuth,couponController.couponStatus)

router.get("/orders",checkAdminAuth,orderController.loadOrders)
router.get("/getOrders",checkAdminAuth,orderController.getOrders)
router.get("/viewOrder/:id",checkAdminAuth,orderController.loadViewOrders)
router.get("/cancelReturn",checkAdminAuth,orderController.loadCancelReturn);
router.get("/getReturnCancel",checkAdminAuth,orderController.getReturnCancel);
router.post("/rejectCancelRequest",checkAdminAuth,orderController.rejectCancelRequest);
router.post("/acceptRequest",checkAdminAuth,orderController.acceptRequest);
router.patch("/updateOrderStatus/:itemId",checkAdminAuth,orderController.updateOrderStatus);

router.get("/offers",checkAdminAuth,offerController.loadOffers)
router.get("/getOffers",checkAdminAuth,offerController.getOffers)
router.get("/addOffer",checkAdminAuth,offerController.loadAddOffers)
router.post("/addOffer",checkAdminAuth,offerController.addOffers)
router.get("/updateOffer/:id",checkAdminAuth,offerController.loadUpdateOffers)
router.post("/updateOffer",checkAdminAuth,offerController.updateOffers)
router.put("/update-Offer-status/:id",checkAdminAuth,offerController.updateOffersStatus)

router.get("/sales",checkAdminAuth,adminController.loadSales)
router.post("/salesReport",checkAdminAuth,adminController.salesReport)


router.get("/logout",checkAdminAuth,adminController.logout)

module.exports = router;