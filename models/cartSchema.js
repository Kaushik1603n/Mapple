const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity:{
        type:Number,
        default:1
      },
      price:{
        type:Number,
        required:true
      },
      totalprice:{
        type:Number,
        required:true
      },
      status:{
        type:String,
        default:"placed"
      },
      cancellationReason:{
        type:String, 
        default:"none"
      }

    },
  ],
});

const cart = mongoose.model("cart", cartSchema)
module.exports= cart;