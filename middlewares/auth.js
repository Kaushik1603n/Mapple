const { error } = require("console");
const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((data) => {
        if (data && !data.isBlock) {
          next();
        } else {
          res.redirect("/user/login");
        }
      })
      .catch((error) => {
        console.log("Error in user auth middleware");
        res.status(500).send("Internal sever Error");
      });
  } else {
    res.redirect("/user/login");
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

module.exports = {
  userAuth,
  adminAuth,
};
