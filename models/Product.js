const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: String,
     required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  },
  deletedBy: {
    type: String
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {timestamps: true});

module.exports = mongoose.model("Product", productSchema);
