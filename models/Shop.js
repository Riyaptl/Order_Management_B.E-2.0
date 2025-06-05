const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  addressLink: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: String,
  },
  deletedAt: {
    type: Date,
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
  }
}, { timestamps: true });

module.exports = mongoose.model("Shop", ShopSchema);
