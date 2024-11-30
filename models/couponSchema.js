const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const couponSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  createAt:{
    type:Date,
    default:Date.now,    
    required:true,
  },
  expireOn:{
    type:Date,
    required:true,
  },
  offerPrice: {
    type: Number,
    required: true,
  },
  mininumPrice: {
    type: Number,
    default: 0,
  },
  isList: {
    type: Boolean,
    required: true,
  },
  userId:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
  }],
 
});

const coupon = mongoose.model("coupon", couponSchema)
module.exports = coupon;
