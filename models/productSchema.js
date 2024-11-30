const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

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
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "category",
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
    salePrice: {
      type: Number,
      default: true,
    },
    color: {
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
  },
  { timestamps: true }
);

const product = mongoose.Model("product",productSchema)

module.exports= product; 