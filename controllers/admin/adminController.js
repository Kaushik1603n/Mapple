const Admin = require("../../models/adminSchema");
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
    pageerror,
    logout,
}