const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const categotySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  // categotyOffer: {
  //   type: Number,
  //   default: 0,
  // },
  createAt: {
    type: Date,
    default: Date.now,
  },
});

const categoty = mongoose.model("category", categotySchema);
module.exports = categoty;
