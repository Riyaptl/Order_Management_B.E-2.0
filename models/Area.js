const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  distributor: {
    type: String,
  },
  shops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
  }],
  areas: [{
    type: String
  }],
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Area", AreaSchema);
