const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Product = require("../../models/productSchema");
const address = require("../../models/addressSchema");
const cart = require("../../models/cartSchema");
const order = require("../../models/orderSchema");
const Review = require("../../models/reviewSchema");
const Offer = require("../../models/offerSchema");

// const wishlist = require("../../models/wishlistSchema");
// const Wallet = require("../../models/walletSchema");
// const coupon = require("../../models/couponSchema");
// const Razorpay = require("razorpay");
// const Referral = require("../../models/referralSchema");
// const failedorder = require("../../models/faildOrders");
// const PDFDocument = require("pdfkit");

const loadProductDetails = async (req, res) => {
  const { productId } = req.params;
  const { color, variant } = req.query;
  const user = req.session.user;

  try {
    let productDetails = await Product.findOne({ _id: productId }).populate(
      "category"
    );

    const productName = `${productDetails.productName} ${productDetails.variant} ${productDetails.processor} ${productDetails.color}`;

    const findPrdOffer = await Offer.findOne({
      productCategory: productName,
      status: "Active",
    });
    const findCatOffer = await Offer.findOne({
      productCategory: productDetails.category.name,
      status: "Active",
    });
    // console.log(findPrdOffer);
    // console.log(findCatOffer);

    let productOffer;
    let cattegoryOffer;
    if (findPrdOffer) {
      if (new Date() <= new Date(findPrdOffer.endDate)) {
        productOffer = findPrdOffer.offer;
      }
    }

    if (findCatOffer) {
      if (new Date() <= new Date(findCatOffer.endDate)) {
        cattegoryOffer = findCatOffer.offer;
      }
    }

    const productCategoryOffer = (productOffer || 0) + (cattegoryOffer || 0);
  

    let allReview = await Review.find({ product: productId }).populate(
      "user",
      "name email"
    );

    const products = await Product.aggregate([{ $sample: { size: 4 } }]);

    if (!productDetails) {
      return res.status(400).json({ message: "Product not found" });
    }

    const currentVariant = productDetails.variant;
    const currentColor = productDetails.color;

    const relatedProducts = await Product.find({
      productName: productDetails.productName,
    });

    const variantColors = relatedProducts
      .filter((product) => product.variant === (variant || currentVariant))
      .map((product) => product.color);

    const activeVariant = variant || currentVariant;
    const activeColor = color || currentColor;
    // console.log(activeVariant);

    if (color || variant) {
      const filteredProduct = relatedProducts.find((product) => {
        return (
          (!color || product.color === color) &&
          (!variant || product.variant === variant)
        );
      });

      if (filteredProduct) {
        productDetails = filteredProduct;
      }
    }

    const availableVariants = [
      ...new Set(relatedProducts.map((product) => product.variant)),
    ];

    const availableColors = [...new Set(variantColors)];
 
    res.render("user/productDetails", {
      productDetails,
      availableColors,
      availableVariants,
      activeVariant,
      activeColor,
      products,
      allReview: allReview || [],
      productOffer: productCategoryOffer,
      user,
    });
  } catch (error) {
    console.error("Error loading product details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addCart = async (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ success: false, message: "Login first" });
  }
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const userData = req.session.user;
    const userId = userData._id;
    // console.log(userId);

    let userCart = await cart.findOne({ userId: userId });
    if (!userCart) {
      userCart = new cart({ userId: userId, items: [] });
    }

    const existingItem = userCart.items.find(
      (item) => item.productId.toString() === productId
    );
    const product = await Product.findById(productId).populate("category");

    const productCategory = product.category.name;
    let findcategoryOffer = { offer: 0 };
    const categoryOffer = await Offer.findOne({
      productCategory: productCategory,
      status: "Active",
    });

    if (categoryOffer) {
      if (new Date() <= new Date(categoryOffer.endDate)) {
        findcategoryOffer = categoryOffer;
      }
    }

    let findOffer = { offer: 0 };
    if (product.specialOffer) {
      const productOffer = await Offer.findOne({
        productCategoryID: product._id,
        status: "Active",
      });
      if (productOffer && new Date() <= new Date(productOffer.endDate)) {
        findOffer = productOffer;
      }
    }

    findOffer.offer = (findcategoryOffer.offer || 0) + (findOffer.offer || 0);

    const hasOffer = findOffer && findOffer.offer > 0;
    if (existingItem) {
      const totalStock = product.quantity;

      if (existingItem.quantity + quantity <= totalStock) {
        existingItem.quantity += quantity;
        existingItem.totalprice = existingItem.quantity * existingItem.price;
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Stock out Product" });
      }
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      userCart.items.push({
        productId: productId,
        quantity: quantity,
        regularPrice: product.regularPrice,
        price: hasOffer
          ? product.regularPrice -
            (product.regularPrice * findOffer.offer) / 100
          : product.salePrice || product.regularPrice,
        totalprice: hasOffer
          ? product.regularPrice * quantity -
            (product.regularPrice * quantity * findOffer.offer) / 100
          : (product.salePrice || product.regularPrice) * quantity,
        discount: hasOffer
          ? (product.regularPrice * quantity * findOffer.offer) / 100
          : product.regularPrice * quantity -
            (product.salePrice || product.regularPrice) * quantity,
      });
    }

    userCart.totalAmount = userCart.items.reduce(
      (sum, item) => sum + item.totalprice,
      0
    );

    await userCart.save();

    // success response
    return res
      .status(200)
      .json({ success: true, message: "Product added to cart" });
  } catch (error) {
    console.error("Error in addCart:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const loadAddCart = async (req, res) => {
  const userData = req.session.user;
  if (!req.session.user) {
    return res.redirect("/user/login");
  }
  try {
    const userId = userData._id;
    const userCart = await cart.findOne({ userId }).populate("items.productId");

    res.render("user/cart", { userCart: userCart || [] });
  } catch (error) {}
};

const removeCartItem = async (req, res) => {
  const { id } = req.params;
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const cartItems = await cart
      .findOne({ userId })
      .populate("items.productId");
    // console.log(cartItems);
    const updatedItems = cartItems.items.filter(
      (item) => item._id.toString() !== id
    );
    // console.log(updatedItems);

    cartItems.items = updatedItems;
    const updatedCart = await cartItems.save();

    res.json({
      items: updatedCart.items,
      totalAmount: updatedCart.totalAmount,
      totalDiscountAmount: updatedCart.totalDiscountAmount,
      totalActualAmount: updatedCart.totalActualAmount,
    });

    // res.status(200).json({ message: "Item removed successfully" });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Error removing item from cart" });
  }
};

const updatequantity = async (req, res) => {
  const userData = req.session.user;
  const userId = userData._id;
  try {
    const { itemId, action } = req.body;
    const cartItems = await cart.findOne({ userId: userId });

    const item = cartItems.items.find((item) => item._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    const product = await Product.findById(item.productId);

    if (action === "increment" && item.quantity >= product.quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    if (action === "increment") {
      item.quantity += 1;
    } else if (action === "decrement" && item.quantity > 1) {
      item.quantity -= 1;
    } else {
      return res
        .status(400)
        .json({ message: "Quantity cannot be less than 1" });
    }

    item.totalprice = item.quantity * item.price;

    const updatedCart = await cartItems.save();

    // return res.status(200).json({ quantity: item.quantity });
    res.json({
      items: updatedCart.items,
      totalAmount: updatedCart.totalAmount,
      totalDiscountAmount: updatedCart.totalDiscountAmount,
      totalActualAmount: updatedCart.totalActualAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating quantity" });
  }
};

module.exports = {
  loadProductDetails,
  addCart,
  loadAddCart,
  removeCartItem,
  updatequantity,
};
