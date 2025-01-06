const Admin = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const bcrypt = require("bcrypt");
// const { log } = require("console");
const product = require("../../models/productSchema");
const order = require("../../models/orderSchema");
const Wallet = require("../../models/walletSchema");
const coupon = require("../../models/couponSchema");
const Offer = require("../../models/offerSchema");
const { default: mongoose } = require("mongoose");

const loadOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    const totalOrders = await order.countDocuments();

    const orders = await order.aggregate([
      { $unwind: "$orderedItem" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.render("admin/orders", {
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    const totalOrders = await order.countDocuments();

    const orders = await order.aggregate([
      { $unwind: "$orderedItem" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const loadViewOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);

    const findOrder = await order.aggregate([
      {
        $unwind: "$orderedItem",
      },
      {
        $match: {
          "orderedItem._id": objectId,
        },
      },
    ]);
    // console.log(findOrder);

    if (!findOrder) {
      return res.status(400).json("order not fount");
    }

    res.render("admin/orderDetails", { orderDetails: findOrder });
  } catch (error) {
    console.log(error);
  }
};

const loadCancelReturn = async (req, res) => {
  try {
    const orders = await order.aggregate([
      {
        $match: {
          "orderedItem.status": { $in: ["Return Request", "Cancel Request"] },
        },
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          orderedItem: {
            $filter: {
              input: "$orderedItem",
              as: "item",
              cond: {
                $in: ["$$item.status", ["Return Request", "Cancel Request"]],
              },
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // console.log(orders);

    // console.log(orders);

    res.render("admin/cancelReturn", { orders });
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};

const getReturnCancel = async (req, res) => {
  try {
    const orders = await order.aggregate([
      {
        $match: {
          "orderedItem.status": { $in: ["Return Request", "Cancel Request"] },
        },
      },
      {
        $project: {
          orderId: 1,
          createdAt: 1,
          orderedItem: {
            $filter: {
              input: "$orderedItem",
              as: "item",
              cond: {
                $in: ["$$item.status", ["Return Request", "Cancel Request"]],
              },
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // console.log(orders);

    // console.log(orders);

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.log("products error:", error);
    res.redirect("/admin/pageerror");
  }
};
const rejectCancelRequest = async (req, res) => {
  const { productId, orderId, rejectReason } = req.body;
  // console.log(req.body);

  try {
    const findOrder = await order.findOne({"orderedItem._id": productId},{"orderedItem.status":1})
    const status =findOrder.orderedItem[0].status;
    let oldStatus;
    // console.log(status)
    if(status =="Cancel Request"){
      oldStatus="pending";
    }else{
      oldStatus = "Delivered"
    }
    
    const updatedOrder = await order.findOneAndUpdate(
      { _id: orderId, "orderedItem._id": productId },
      {
        $set: {
          "orderedItem.$.status": oldStatus,
          "orderedItem.$.rejectionReason": rejectReason,
        },
      },
      { new: true }
    );
    // console.log(updatedOrder);
    res
      .status(200)
      .json({ success: true, message: "Cancel request rejected successfully" });
  } catch (error) {
    console.log("cancel error:", error);
    res.redirect("/admin/pageerror");
  }
};

const acceptRequest = async (req, res) => {
  const { orderId, productId, quantity, itemId, status } = req.body;
  console.log(req.body);
  const userData = req.session.user;

  try {
    let newStatus;
    if (status == "Cancel Request") newStatus = "Canceled";
    if (status == "Return Request") newStatus = "Returned";
    // console.log(newStatus);

    const prdQuantity = parseInt(quantity);
    const products = await product.findOne({ _id: productId });

    const updatedStatus = await order.findOneAndUpdate(
      { "orderedItem._id": itemId },
      {
        $set: {
          "orderedItem.$.status": newStatus,
        },
      },
      { new: true }
    );

    const findOrder = await order.findOne({ orderId: orderId });
    const findUser = await User.findById(findOrder.userId);
    // console.log(findOrder.paymentMethod);

    if (status == "Cancel Request" && findOrder.paymentMethod == "upi") {
      let userwallet = await Wallet.findOne({ user: findUser._id });
      if (!userwallet) {
        userwallet = new Wallet({ user: findUser._id, transactions: [] });
      }

      const amountToAdd = Number(products.salePrice) * Number(quantity);

      userwallet.balance = Number(userwallet.balance) + amountToAdd;
      console.log("Updated Wallet Balance:", userwallet.balance);

      userwallet.transactions.push({
        transactionType: "deposit",
        amount: amountToAdd,
        description: "Refund for canceled order",
      });

      try {
        await userwallet.save();
        console.log("Wallet Updated Successfully");
      } catch (error) {
        console.error("Error Saving Wallet:", error);
      }
    }

    // console.log("Order Status Updated:", updatedStatus);
    if (status == "Return Request" && updatedStatus) {
      let userwallet = await Wallet.findOne({ user: findUser._id });
      // console.log("User Wallet Found:", userwallet);

      if (!userwallet) {
        userwallet = new Wallet({ user: findUser._id, transactions: [] });
      }

      const amountToAdd = Number(products.salePrice) * Number(quantity);

      userwallet.balance = Number(userwallet.balance) + amountToAdd;
      console.log("Updated Wallet Balance:", userwallet.balance);

      userwallet.transactions.push({
        transactionType: "deposit",
        amount: amountToAdd,
        description: "Refund for canceled order",
      });

      try {
        await userwallet.save();
        console.log("Wallet Updated Successfully");
      } catch (error) {
        console.error("Error Saving Wallet:", error);
      }
    }

    const updatedOrder = await product.findOneAndUpdate(
      { _id: productId },
      {
        $inc: {
          quantity: prdQuantity,
        },
        $set: {
          status: "Available",
        },
      },
      { new: true }
    );
    // console.log(updatedOrder);
    res
      .status(200)
      .json({ success: true, message: "Request Accept successfully" });

    // if (["Delivered", "Cancel", "Returned"].includes(product.status)) {
    //   return res.status(400).json({
    //     message: `Status cannot be updated as it is already '${product.status}'.`,
    //   });
    // }
  } catch (error) {
    console.log("cancel error:", error);
    res.redirect("/admin/pageerror");
  }
};

const updateOrderStatus = async (req, res) => {
  const { itemId } = req.params;
  const { status } = req.body;
  // console.log(itemId, status);
  try {
    // if (["Delivered", "Cancel", "Returned"].includes(product.status)) {
    //   return res.status(400).json({
    //     message: `Status cannot be updated as it is already '${product.status}'.`,
    //   });
    // }
    const updateStatus = await order.findOneAndUpdate(
      { "orderedItem._id": itemId },
      {
        $set: {
          "orderedItem.$.status": status,
          status: status,
        },
      },
      { new: true }
    );
    console.log(updateStatus);

    if (updateStatus) {
      res.status(200).json({
        success: true,
        message: "Order status updated successfully!",
        data: updateStatus,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Order not found or status update failed.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadOrders,
  getOrders,
  loadViewOrders,
  loadCancelReturn,
  getReturnCancel,
  rejectCancelRequest,
  acceptRequest,
  updateOrderStatus,
};
