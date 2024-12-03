const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    // Boolean to indicate admin privileges
    type: Boolean,
    required: true,
    default: true, // Default to true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
