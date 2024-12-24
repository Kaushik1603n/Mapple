const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    orderedItem: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        firstImage: {
          type: String,
          required: true,
        },
        productColor: {
          type: String,
          required: true,
        },
        productStorage: {
          type: String, // Changed to String
          required: true,
        },
        productProcessor: {
          type: String, // Changed to String
          required: true,
        },
        description: {
          type: String, // Changed to String
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        regularPrice: {
          type: Number,
          required: true,
        },
        regularTotal: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
          default: 0,
        },
        status: {
          type: String,
          required: true,
          enum: [
            "pending",
            "processing",
            "shipped",
            "Delivered",
            "Canceled",
            "Cancel Request",
            "Return Request",
            "Returned",
          ],
          default:"pending",
        },
        reason:{
          type:String,
          default:null
        },
        rejectionReason:{
          type:String,
          default:null
        }
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      name: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      homeAddress: { type: String, required: true },
      landmark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    billingDetails: {
      name: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      homeAddress: { type: String, required: true },
      landmark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    invoiceDate: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "processing",
        "shipped",
        "Delivered",
        "cancel",
        "Return Request",
        "Returned",
      ],
    },
    createAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    couponApplied: {
      type: Boolean,
      default: false,
    },
    couponDiscount: {
      type: Number,
      default: false,
    },
    trackingId: {
      type: String,
    },
    shippingProvider: {
      type: String,
    },
  },
  { timestamps: true }
);

const order = mongoose.model("order", orderSchema);
module.exports = order;
