const { error } = require("console");
const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");

// const userAuth = (req, res, next) => {
//   if (req.session.user) {
//     User.findById(req.session.user._id)
//       .then((data) => {
//         if (data && !data.isBlock) {
//           next();
//         } else {
//           res.redirect("/user/login");
//         }
//       })
//       .catch((error) => {
//         console.log("Error in user auth middleware");
//         res.status(500).send("Internal sever Error");
//       });
//   } else {
//     res.redirect("/user/login");
//   }
// };

const userAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user._id)
      .then((data) => {
        if (data) {
          if (!data.isBlock) {
            return next();
          } else {
            req.session.user=null;
            return res.redirect("/user/login");
          }
        } else {
          return res.redirect("/user/login");
        }
      })
      .catch((error) => {
        console.log("Error in user auth middleware:", error);
        return res.status(500).send("Internal server error");
      });
  } else {
    return res.redirect("/user/login");
  }
};

const isLogin = (req, res, next) => {
  if (req.session.user) {
    res.redirect("/user");
  } else {
    next();
  }
};

const adminAuth = (req, res, next) => {
  Admin.findOne({ isAdmin: true })
    .then((data) => {
      if (data) {
        next();
      } else {
        res.redirect("/admin/login");
      }
    })
    .catch((error) => {
      console.log("Error in admin auth middleware", error);
      res.status(500).send("Internal sever Error");
    });
};

const checkAdminAuth =(req,res,next)=>{
  try {

    if(!req.session.admin){
      // console.log("/admin/login");
      
      res.redirect("/admin/login");
    }else{
      next();
    }
    
    
  } catch (error) {
    console.log("Error in admin checkAdminAuth ", error);
    res.status(500).send("Internal sever Error");
  }
}
const storeSessionEmail = (req, res, next) => {
  if (req.user) {
    req.session.user = req.user;
    // console.log(req.user.name);
  }
  next();
};

// const validRegisteredUser = async (req, res, next) => {
//   try {
//     if (!req.session.registerUser) {
//       return res.redirect("/user/signup");
//     }
//     next();
//   } catch (error) {}
// };

module.exports = {
  userAuth,
  adminAuth,
  isLogin,
  storeSessionEmail,
  checkAdminAuth,
  // validRegisteredUser,
};
