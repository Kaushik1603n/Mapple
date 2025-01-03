const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const productController = require("../../controllers/admin/productCondroller");
const {userAuth,adminAuth,checkAdminAuth} = require("../../middlewares/auth")

router.get("/pageerror",adminController.pageerror)
router.get("/login", adminController.loadLogin);
router.post("/login",adminAuth, adminController.login);
router.get("/dashboard",checkAdminAuth,adminController.loadDashboard)
router.get("/sales-data",checkAdminAuth,adminController.salesData)
router.get("/discount-data",checkAdminAuth,adminController.discountDdata)
router.get("/ledger-data",checkAdminAuth,adminController.ledgerData)

router.get("/customer",checkAdminAuth,adminController.loadCustomer)
router.put('/update-customer-status/:userId',checkAdminAuth,adminController.updateCustomerStatus)
router.delete('/deleteCustomer/:id', checkAdminAuth,adminController.deleteCustomer);
router.get('/addCustomer', checkAdminAuth,adminController.loadAddCustomer);
router.post('/addCustomer', checkAdminAuth,adminController.addCustomer);
router.get('/updateCustomer/:id', checkAdminAuth,adminController.loadUpdateCustomer);
router.get('/updateCustomerDetails/:id', checkAdminAuth,adminController.loadUpdateCustomerPage);
router.post('/updateCustomer', checkAdminAuth,adminController.updateCustomer);

router.get("/category",checkAdminAuth,adminController.loadcategory)
router.get("/addCategory",checkAdminAuth,adminController.loadAddCategory)
router.post("/addCategory",checkAdminAuth,adminController.addCategory)
router.get("/editCategory/:id",checkAdminAuth,adminController.loadEditCategory)
router.post("/editCategory",checkAdminAuth,adminController.editCategory)
router.patch("/updateCategoryStatus/:id",checkAdminAuth,adminController.editCategoryStatus)
router.delete("/deleteCategory/:id",checkAdminAuth,adminController.deleteCategory)

router.get("/products",checkAdminAuth,productController.loadproducts)
router.get("/addProduct",checkAdminAuth,productController.loadAddProducts)
router.post("/addProduct",checkAdminAuth,productController.uploadImages,productController.addProducts)
router.get("/updateProduct/:id",checkAdminAuth,productController.loadUpdateProduct)
router.put("/updateProduct",checkAdminAuth,productController.uploadImages,productController.updateProduct)
router.patch("/updateProductStatus/:id",checkAdminAuth,productController.editProductStatus)
router.delete("/deleteProductImage/:productId",checkAdminAuth,productController.deleteProductImage)
router.delete("/deleteProduct/:id",checkAdminAuth,productController.deleteProduct)

router.get("/coupon",checkAdminAuth,adminController.loadCoupon)
router.get("/addCoupon",checkAdminAuth,adminController.loadAddCoupon)
router.post("/addcoupon",checkAdminAuth,adminController.addCoupon)
router.get("/updateCoupon/:id",checkAdminAuth,adminController.loadUpdateCoupon)
router.post("/updatecoupon",checkAdminAuth,adminController.updateCoupon)
router.delete("/deleteCoupon/:id",checkAdminAuth,adminController.deleteCoupon)
router.put("/update-Coupon-status/:id",checkAdminAuth,adminController.couponStatus)

router.get("/orders",checkAdminAuth,adminController.loadOrders)
router.get("/viewOeder/:id",checkAdminAuth,adminController.loadViewOrders)
router.get("/cancelReturn",checkAdminAuth,adminController.loadCancelReturn);
router.post("/rejectCancelRequest",checkAdminAuth,adminController.rejectCancelRequest);
router.post("/acceptRequest",checkAdminAuth,adminController.acceptRequest);
router.patch("/updateOrderStatus/:itemId",checkAdminAuth,adminController.updateOrderStatus);

router.get("/offers",checkAdminAuth,adminController.loadOffers)
router.get("/addOffer",checkAdminAuth,adminController.loadAddOffers)
router.post("/addOffer",checkAdminAuth,adminController.addOffers)
router.get("/updateOffer/:id",checkAdminAuth,adminController.loadUpdateOffers)
router.post("/updateOffer",checkAdminAuth,adminController.updateOffers)
router.put("/update-Offer-status/:id",checkAdminAuth,adminController.updateOffersStatus)

router.get("/sales",checkAdminAuth,adminController.loadSales)
router.post("/salesReport",checkAdminAuth,adminController.salesReport)


router.get("/logout",checkAdminAuth,adminController.logout)

module.exports = router;