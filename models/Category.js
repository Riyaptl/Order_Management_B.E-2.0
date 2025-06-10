const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  products: [{ 
    type: String
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

module.exports = mongoose.model("Category", categorySchema);
