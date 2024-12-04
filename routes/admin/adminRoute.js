const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const {userAuth,adminAuth} = require("../../middlewares/auth")

router.get("/pageerror",adminController.pageerror)
router.get("/login", adminController.loadLogin);
router.post("/login",adminAuth, adminController.login);
router.get("/dashboard",adminController.loadDashboard)

router.get("/customer",adminController.loadCustomer)
router.put('/update-customer-status/:userId',adminController.updateCustomerStatus)
router.delete('/deleteCustomer/:id', adminController.deleteCustomer);

router.get("/category",adminController.loadcategory)
router.get("/addCategory",adminController.loadAddCategory)
router.post("/addCategory",adminController.addCategory)
router.get("/editCategory",adminController.loadEditCategory)

router.get("/products",adminController.loadproducts)
router.get("/addProduct",adminController.loadAddProducts)





router.get("/logout",adminController.logout)

module.exports = router;