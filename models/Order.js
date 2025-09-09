const mongoose = require("mongoose");

const productList = [
  "Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g",
  "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
  "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g",
  "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
  "Intense Coffee 25g", "Toxic Coffee 25g", "Gift box", 
  "Hazelnut & Blueberries", "Roasted Almonds & Pink Salt", "Kiwi & Pineapple", "Ginger & Cinnamon", "Pistachio & Black Raisin", "Dates & Raisin"
];

const totalList = [
  "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g", "Gift box",
  "Hazelnut & Blueberries", "Roasted Almonds & Pink Salt", "Kiwi & Pineapple", "Ginger & Cinnamon", "Pistachio & Black Raisin", "Dates & Raisin"
];


const orderSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  placedBy: {
    type: String,
    required: true
  },
  products: {
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => productList.includes(key));
      },
      message: "One or more product names are invalid"
    }
  },
  total:{
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => totalList.includes(key));
      },
      message: "One or more total names are invalid"
    }
  },
  return_products: {
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => productList.includes(key));
      },
      message: "One or more product names are invalid"
    }
  },
  return_total:{
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => totalList.includes(key));
      },
      message: "One or more total names are invalid"
    }
  },
  location: {
    type: {
        latitude: Number,
        longitude: Number
    }
  },
  paymentTerms: {
    type: String,
    enum: ["cash", "cheque", "company credit", "sr credit", "distributor credit", ""]
  },
  remarks: {
    type: String
  },
  orderPlacedBy: {
    type: String
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: String
  },
  deletedAt: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["delivered", "pending", "canceled", "partial return"],
    default: "pending"
  },
  statusUpdatedBy: {
    type: String,
  },
  statusUpdatedAt: {
    type: Date,
  },
  canceledReason: {
    type: String,
  },
  type: {
    type: String,
    enum: ["order", "replacement", "return"],
    default: "order"
  },
  createdAt: {
    type: Date
  }
});
// { timestamps: true }

module.exports = mongoose.model("Order", orderSchema);
