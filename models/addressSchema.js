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
      homeAddress: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
        trim: false,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: Number,
        required: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const address = mongoose.model("addess", addessSchema);
module.exports = address;
