const loadHomePage = async (req, res) => {
  try {
    return res.render("user/home");
  } catch (error) {
    console.log("home Page Not Fount");
    res.status(500).send("Sever error");
    
  }
};


module.exports={
    loadHomePage,
}