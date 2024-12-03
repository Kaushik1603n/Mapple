const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");


const pageerror = (req, res) => {
    res.render("pageerror");
}


const loadLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin/dashboard");
    }
    res.render("admin/login", { message: null });
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("admin/login", { message: "Email and password are required." });
        }

        const admin = await Admin.findOne({email});
        // console.log(admin);
        // const passwordHash =  await bcrypt.hash(password, 10)
        // console.log(passwordHash);        
        if (!admin) {
            console.log("admin not found");
            
            return res.render("admin/login", { message: "Admin not found. Check your email." });
        }

        if (!admin.isAdmin) {
            console.log("Access denied: User is not an admin");
            return res.render("admin/login", { message: "Access denied. You are not an admin." });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (passwordMatch) {
            req.session.admin = true;
            return res.redirect("/admin/dashboard");
        } else {
            return res.render("admin/login", { message: "Incorrect password." });
        }
    } catch (error) {
        console.log("Login error:", error);
        return res.render("admin/login", { message: "An error occurred. Please try again later." });
    }
};


const loadDashboard = async (req, res) => {
    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }
    try {
        res.render("admin/dashboard");
    } catch (error) {
        console.log("Dashboard error:", error);
        res.redirect("/admin/pageerror");
    }
};

const loadCustomer = async (req,res)=>{
    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }
    try {
        const user = await User.find({});        
        res.render("admin/customer",{ user });
    } catch (error) {
        console.log("Dashboard error:", error);
        res.redirect("/admin/pageerror");
    }
};

// Update user status route
const updateCustomerStatus = async (req, res) => {
    const { userId } = req.params;
    const { isBlock } = req.body;    
    
    try {
        // Update the user's `isBlock` status in the database
        const result = await User.findByIdAndUpdate(
            userId,
            { isBlock: Boolean(isBlock) },
            { new: true } 
        );
        
        if (result) {
            return res.status(200).json({ success: true, message: 'User status updated successfully.' });
        } else {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while updating user status.' });
    }
};

const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    console.log(req);
    
    try {
        // Attempt to delete the user
        const result = await User.findOneAndDelete({ _id: id });
        console.log(result);
        
        // If result is null, the user was not found
        if (result) {
            return res.status(200).json({ success: true, message: 'User deleted successfully.' });
        } else {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the user.' });
    }
};

const loadcategory = async (req,res)=>{
    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }
    try {
        res.render("admin/category");
    } catch (error) {
        console.log("category error:", error);
        res.redirect("/admin/pageerror");
    }
};
const loadproducts = async (req,res)=>{
    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }
    try {
        res.render("admin/products");
    } catch (error) {
        console.log("products error:", error);
        res.redirect("/admin/pageerror");
    }
};
const loadAddProducts = async (req,res)=>{
    if (!req.session.admin) {
        return res.redirect("/admin/login");
    }
    try {
        res.render("admin/addProduct");
    } catch (error) {
        console.log("products error:", error);
        res.redirect("/admin/pageerror");
    }
};


const logout = (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session", err);
                return re.redirect("/admin/pageerror")
            }
            res.redirect("/admin/login");
        })

    } catch (error) {
        console.log("unexpected error during logout")
        res.redirect("/admin/pageerror")
    }
}




module.exports ={
    loadLogin,
    login,
    loadDashboard,
    loadCustomer,
    updateCustomerStatus,
    deleteCustomer,
    loadcategory,
    loadproducts,
    loadAddProducts,
    pageerror,
    logout,
}