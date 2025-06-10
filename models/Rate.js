const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  percantage: {
    type: String
  },
  distributors: [{ 
    type: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  areaIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  }],
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

module.exports = mongoose.model("Rate", rateSchema);
