const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  orderedItem: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: 0,
      },
    },
  ],
  totalPrice: {
    type: Number,
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
  address:{
    type:Schema.Types.ObjectId,
    ref:"user",
    required:true
  },
  invoiceDate:{
    type:Date
  },
  status:{
    type:String,
    required:true,
    enum:["pending","processing","shipped","Delivered","cancel","Return Request","Returned"]
  },
  createAt:{
    type:Date,
    default:Date.now,    
    required:true,
  },
  couponApplied:{
    type:Boolean,
    default:false
  }
});

const order = mongoose.model("order", orderSchema)
module.exports = order;
