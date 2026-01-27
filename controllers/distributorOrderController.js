const DistributorOrder = require("../models/DistributorOrder")
const User = require("../models/User")
const { Parser } = require("json2csv");

//  Create order
const createDistributorOrder = async (req, res) => {
  try {
    const {
      distributor,
      placedBy,
      products,
      expected_delivery,
      orderPlacedBy,
      remarks,
      address,
      contact
    } = req.body;

    // Basic required validation
    if (!distributor) {
      return res.status(400).json({ message: "Distributor is required" });
    }

    if (!products || Object.keys(products.toObject ? products.toObject() : products).length === 0) {
      return res.status(400).json({ message: "Products are required" });
    }

    // Calculate total if products exist
    let total = {}

    // Mapping of product keys to their respective total category
    const totalMapping = {
      "Regular 50g": ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g"],
      "Coffee 50g": ["Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g"],
      "Regular 25g": ["Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Orange 25g", "Mint 25g", "Blueberry 25g", "Hazelnut 25g"],
      "Coffee 25g": ["Classic Coffee 25g", "Dark Coffee 25g", "Intense Coffee 25g", "Toxic Coffee 25g"],
      "Gift box": ["Gift box"],
      "Hazelnut & Blueberries 55g": ["Hazelnut & Blueberries 55g"],
      "Roasted Almonds & Pink Salt 55g": ["Roasted Almonds & Pink Salt 55g"],
      "Kiwi & Pineapple 55g": ["Kiwi & Pineapple 55g"],
      "Ginger & Cinnamon 55g": ["Ginger & Cinnamon 55g"],
      "Pistachio & Black Raisin 55g": ["Pistachio & Black Raisin 55g"],
      "Dates & Raisin 55g": ["Dates & Raisin 55g"]
    };

    // Calculate total object
    total = {
      "Regular 50g": 0,
      "Coffee 50g": 0,
      "Regular 25g": 0,
      "Coffee 25g": 0,
      "Gift box": 0,
      "Hazelnut & Blueberries 55g": 0,
      "Roasted Almonds & Pink Salt 55g": 0,
      "Kiwi & Pineapple 55g": 0,
      "Ginger & Cinnamon 55g": 0,
      "Pistachio & Black Raisin 55g": 0,
      "Dates & Raisin 55g": 0
    };

    // Loop through each category and sum up matching product quantities
    for (const [category, keys] of Object.entries(totalMapping)) {
      keys.forEach((key) => {
        if (products && products[key]) {
          total[category] += products[key];
        }
      });
    }

    // Build order payload
    const orderData = {
      distributor,
      products,
      remarks,
      address,
      contact,
      total: total || {},
      gst: "5",
      createdBy: req.user.username,
      placedBy: placedBy || req.user.username,
      orderPlacedBy: orderPlacedBy,
      status: "pending",
      expected_delivery: expected_delivery || [],
      createdAt: new Date()
    };

    await DistributorOrder.create(orderData);

    return res.status(201).json({
      message: "Distributor order created successfully",
    });

  } catch (error) {
    console.error("Create Distributor Order Error:", error);

    res.status(500).json(error.message);
  }
};

//  update status
const updateDistributorOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      canceledReason,
      ETD,
      delivered_products,
      same_as_products,
      companyRemarks,
      billAttached
    } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (status === "dispatched" && !ETD) {
      return res.status(400).json({ message: "ETD is required for dispatch" });
    }

    const order = await DistributorOrder.findOne({
      _id: id,
      deleted: false
    });

    if (!order) {
      return res.status(404).json({ message: "Distributor order not found" });
    }

    if (status === "delivered" && order.status !== "dispatched") {
      return res.status(400).json({
        message: "Order cannot be marked as delivered unless it has been dispatched"
      });
    }

    /* ---------- Delivered products & totals ---------- */
    if (status === "dispatched" && delivered_products) {
      const totalMapping = {
        "Regular 50g": ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g"],
        "Coffee 50g": ["Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g"],
        "Regular 25g": ["Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Orange 25g", "Mint 25g", "Blueberry 25g", "Hazelnut 25g"],
        "Coffee 25g": ["Classic Coffee 25g", "Dark Coffee 25g", "Intense Coffee 25g", "Toxic Coffee 25g"],
        "Gift box": ["Gift box"],
        "Hazelnut & Blueberries 55g": ["Hazelnut & Blueberries 55g"],
        "Roasted Almonds & Pink Salt 55g": ["Roasted Almonds & Pink Salt 55g"],
        "Kiwi & Pineapple 55g": ["Kiwi & Pineapple 55g"],
        "Ginger & Cinnamon 55g": ["Ginger & Cinnamon 55g"],
        "Pistachio & Black Raisin 55g": ["Pistachio & Black Raisin 55g"],
        "Dates & Raisin 55g": ["Dates & Raisin 55g"]
      };

      const delivered_total = {};
      Object.keys(totalMapping).forEach(category => delivered_total[category] = 0);

      for (const [category, keys] of Object.entries(totalMapping)) {
        keys.forEach(key => {
          if (delivered_products[key]) {
            delivered_total[category] += delivered_products[key];
          }
        });
      }

      // Push a new delivery entry into the array
      order.delivered = order.delivered || [];
      order.delivered.push({
        date: new Date(ETD),
        products: delivered_products,
        total: delivered_total,
        billAttached,
        companyRemarks
      });
    }

    // Update order status
    order.status = status;
    order.statusUpdatedBy = req.user.username;
    order.statusUpdatedAt = new Date();
    order.companyRemarks = companyRemarks

    if (canceledReason) {
      order.canceledReason = canceledReason;
    }
    if (ETD) {
      order.ETD.push(new Date(ETD));
    }

    await order.save();

    return res.status(200).json({
      message: "Distributor order updated successfully"
    });

  } catch (error) {
    console.error("Update Distributor Order Error:", error);
    res.status(500).json(error.message);
  }
};


//  update status
const deliveredDistributorOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { partial } = req.body

    const order = await DistributorOrder.findOne({
      _id: id,
      deleted: false
    });

    if (!order) {
      return res.status(404).json({ message: "Distributor order not found" });
    }

    order.status = partial ? "partial order delivered" : "delivered";
    if (order.delievered_on) {
      order.delievered_on.push(Date.now())
    } else {
      order.delievered_on = [Date.now()]
    }
    await order.save();
    return res.status(200).json({
      message: "Distributor order delivered successfully"
    });

  } catch (error) {
    res.status(500).json(error.message);
  }
};

// read orders
const readDistributorOrders = async (req, res) => {
  try {
    const { distributor, placedBy } = req.body;

    // Base filter
    const query = {
      deleted: false
    };

    // Optional filters
    if (distributor) {
      query.distributor = distributor;
    }

    if (placedBy) {
      query.placedBy = placedBy;
    }

    // if not admin, self orders only
    if (req.user.role !== "admin") {
      query.placedBy = req.user.username;
    }

    const orders = await DistributorOrder
      .find(query)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      message: "Orders received successfully",
      orders
    });

  } catch (error) {
    console.error("Read Distributor Orders Error:", error);
    res.status(500).json(error.message);
  }
};


// delete order
const deleteDistributorOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await DistributorOrder.findOne({
      _id: id,
      deleted: false
    });

    if (!order) {
      return res.status(404).json({
        message: "Distributor order not found or already deleted"
      });
    }

    order.deleted = true;
    order.deletedBy = req.user.username;
    order.deletedAt = new Date();

    await order.save();

    return res.status(200).json({
      message: "Distributor order deleted successfully"
    });

  } catch (error) {
    console.error("Delete Distributor Order Error:", error);
    res.status(500).json(error.message);
  }
};




module.exports = {
  createDistributorOrder,
  updateDistributorOrder,
  readDistributorOrders,
  deleteDistributorOrder,
  deliveredDistributorOrder
};
