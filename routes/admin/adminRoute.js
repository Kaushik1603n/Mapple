const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const productController = require("../../controllers/admin/productCondroller");
const {userAuth,adminAuth} = require("../../middlewares/auth")

router.get("/pageerror",adminController.pageerror)
router.get("/login", adminController.loadLogin);
router.post("/login",adminAuth, adminController.login);
router.get("/dashboard",adminController.loadDashboard)

router.get("/customer",adminController.loadCustomer)
router.put('/update-customer-status/:userId',adminController.updateCustomerStatus)
router.delete('/deleteCustomer/:id', adminController.deleteCustomer);
router.get('/addCustomer', adminController.loadAddCustomer);
router.post('/addCustomer', adminController.addCustomer);
router.get('/updateCustomer/:id', adminController.loadUpdateCustomer);
router.get('/updateCustomerDetails/:id', adminController.loadUpdateCustomerPage);
router.post('/updateCustomer', adminController.updateCustomer);

router.get("/category",adminController.loadcategory)
router.get("/addCategory",adminController.loadAddCategory)
router.post("/addCategory",adminController.addCategory)
router.get("/editCategory/:id",adminController.loadEditCategory)
router.post("/editCategory",adminController.editCategory)
router.patch("/updateCategoryStatus/:id",adminController.editCategoryStatus)
router.delete("/deleteCategory/:id",adminController.deleteCategory)

router.get("/products",productController.loadproducts)
router.get("/addProduct",productController.loadAddProducts)
router.post("/addProduct",productController.uploadImages,productController.addProducts)
router.get("/updateProduct/:id",productController.loadUpdateProduct)
router.put("/updateProduct",productController.uploadImages,productController.updateProduct)
router.patch("/updateProductStatus/:id",productController.editProductStatus)
router.delete("/deleteProductImage/:productId",productController.deleteProductImage)
router.delete("/deleteProduct/:id",productController.deleteProduct)

router.get("/orders",adminController.loadOrders)
router.get("/cancelReturn",adminController.loadCancelReturn);
router.post("/rejectCancelRequest",adminController.rejectCancelRequest);
router.post("/acceptRequest",adminController.acceptRequest);
router.patch("/updateOrderStatus/:itemId",adminController.updateOrderStatus);




router.get("/logout",adminController.logout)

module.exports = router;