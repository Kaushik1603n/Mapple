const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;
const category = require("./categorySchema");

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: false,
      default: "Apple",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    productOffer: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      required: true,
    },

    variant: {
      type: String,
      required: true,
    },

    processor: {
      type: String,
      required: true,
    },

    productImage: {
      type: [String],
      required: true,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Available", "out of stock", "Discountinued"],
      required: true,
      default: "Available",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    reviews: {
      type: Schema.Types.ObjectId,
      ref: "review",
    },
  },
  { timestamps: true }
);

const product = mongoose.model("product", productSchema);

module.exports = product;
