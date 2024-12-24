const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const couponSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  discription: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  maxDiscount: {
    type: Number,
    required: true,
  },
  mininumParchase: {
    type: Number,
    default: 0,
  },
  startDate:{
    type:Date,
    default:Date.now,    
    required:true,
  },
  endDate:{
    type:Date,
    required:true,
  },
  isList: {
    type: Boolean,
    default:true,
  },
  userLimit: {
    type: Number,
    default:null,
  },
  userId:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
  }],
 
});

const coupon = mongoose.model("coupon", couponSchema)
module.exports = coupon;
