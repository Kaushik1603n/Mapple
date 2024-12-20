const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const product = require("./productSchema")
const user = require("./userSchema")

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'product', // Reference to the Product model
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, // Minimum rating of 1
      max: 5, // Maximum rating of 5
    },
    reviewTittle: {
      type: String,
      required: true,
    },
    reviewText: {
      type: String,
      required: true,
      minlength: 1, // Minimum length for the review text
      maxlength: 1000, // Maximum length for the review text
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('review', reviewSchema);
