const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const addessSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  address: [
    {
      addressType: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      landMark: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: Number,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      altPhone: {
        type: String,
        required: true,
      },
    },
  ],
});

const address = mongoose.model("addess", addessSchema);
module.exports = address;
