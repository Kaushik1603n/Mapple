const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      totalprice: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["placed", "shipped", "delivered", "cancelled"],
        default: "placed",
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalActualAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalDiscountAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cartSchema.pre("save", function (next) {
  this.items.forEach((item) => {
    item.totalprice = item.price * item.quantity;
  });

  this.totalActualAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  this.totalAmount = this.totalActualAmount - this.totalDiscountAmount;

  this.updatedAt = Date.now();

  next();
});

const cart = mongoose.model("cart", cartSchema);
module.exports = cart;
