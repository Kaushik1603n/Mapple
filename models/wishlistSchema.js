const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const wishlistSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  product: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      addedOn: {
        type: Date,
        default:Date.now
      },
    },
  ],
});

const wishlist = mongoose.model("wishlist", wishlistSchema);
module.exports = wishlist;
