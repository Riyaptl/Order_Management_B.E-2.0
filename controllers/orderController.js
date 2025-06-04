// controllers/orderController.js
const Order = require("../models/Order");
const Area = require("../models/Area");
const Shop = require("../models/Shop");
const { Parser } = require("json2csv");

const productList = [
  "Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g",
  "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
  "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g",
  "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
  "Intense Coffee 25g", "Toxic Coffee 25g"
];

const totalList = [
  "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g"
];

// Daily report
const dailyReport = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username is required" });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      placedBy: username,
      products: { $ne: {} },
      createdAt: { $gte: startOfMonth, $lte: endOfDay },
      deleted: false,
    });

    const keysToReport = ["Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g"];
    const dailySummary = {};

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0]; // format: YYYY-MM-DD

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          "Regular 50g": 0,
          "Coffee 50g": 0,
          "Regular 25g": 0,
          "Coffee 25g": 0,
        };
      }

      keysToReport.forEach(key => {
        const qty = order.total?.get(key) || 0;
        dailySummary[dateKey][key] += qty;
      });
    });

    // Convert object to array sorted by date
    const reportList = Object.values(dailySummary).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({totalSummary: reportList});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 1. Create Order
const createOrder = async (req, res) => {
  try {
    const { shopId, areaId, products, placedBy, location } = req.body;
    const createdBy = req.user.username;
    const finalPlacedBy = placedBy || createdBy

    const areaExists = await Area.findById(areaId);
    const shopExists = await Shop.findById(shopId);
    if (!areaExists || !shopExists) return res.status(400).json("Invalid area or shop ID");

    let data = { shopId, areaId, placedBy: finalPlacedBy, products, createdBy, location }

    // Calculate total if products exist
    if (Object.keys(products).length !== 0){

      // Mapping of product keys to their respective total category
      const totalMapping = {
        "Regular 50g": ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g"],
        "Coffee 50g": ["Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g"],
        "Regular 25g": ["Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Orange 25g", "Mint 25g"],
        "Coffee 25g": ["Classic Coffee 25g", "Dark Coffee 25g", "Intense Coffee 25g", "Toxic Coffee 25g"]
      };
      
      // Calculate total object
      const total = {
        "Regular 50g": 0,
        "Coffee 50g": 0,
        "Regular 25g": 0,
        "Coffee 25g": 0
      };
      
      // Loop through each category and sum up matching product quantities
      for (const [category, keys] of Object.entries(totalMapping)) {
        keys.forEach((key) => {
          if (products && products[key]) {
            total[category] += products[key];
          }
        });
      }
      data["total"] = total
    } else {
      if (!location) return res.status(400).json("Location not found");
    }

    const order = new Order(data);
    
    await order.save();
    res.status(201).json({"message": "Order created successfully"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. get orders area wise
const getOrdersByArea = async (req, res) => {
  try {
    const { areaId, completeData = false, page = 1, limit = 20, placedOrders } = req.body;

    if (!areaId) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    // Build query
    const query = { areaId, deleted: false };

    if (!completeData) {
     
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfToday, $lte: endOfToday };
    } else {
      const now = new Date();

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    }

    if (placedOrders) {
      query["products"] = { $ne: {} }; 
    } else {
      query["products"] = {}; 
    }
      
    // Pagination params
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate("shopId", "name address contactNumber addressLink")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Optional: total count for frontend pagination controls
    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 3. Soft Delete Order (Admin only)
const softDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user.username;
    
    const order = await Order.findById(id);
    if (!order || order.deleted) return res.status(404).json("Order not found or already deleted");

    order.deleted = true;
    order.deletedBy = deletedBy;
    await order.save();

    res.status(200).json("Order deleted successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// get orders for sales report
const getSalesReport = async (req, res) => {
  try {
    const { username, completeData = false } = req.body;

    // Build query
    const query = { deleted: false, products: { $ne: {} } };

    // Get area ids, if distributor
    if (username){
      const areaIds = await Area.find({distributor: username}, "id") 
      query["areaId"] = {$in: areaIds}
    }

    if (!completeData) {
     
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfToday, $lte: endOfToday };
    } else {
      const now = new Date();

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    }
     
    const orders = await Order.find(query, {products: 1, total: 1})
    
    const keysToReport = ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g",
    "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
    "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g",
    "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
    "Intense Coffee 25g", "Toxic Coffee 25g"]
    
    const totalList = [
      "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g"
    ];

    const amountTotal = [40, 50, 27, 30]
    const productTotals = {};
    const overallTotals = {};

    keysToReport.forEach(key => {
      productTotals[key] = 0;
    });
    totalList.forEach(key => {
      overallTotals[key] = 0;
    });

    for (const order of orders) {
      const orderProducts = order.products || {};
      const orderTotal = order.total || {};
      keysToReport.forEach(key => {
        if (orderProducts.get(key)) {
          productTotals[key] += orderProducts.get(key);
        }
      });
      totalList.forEach(key => {
        if (orderTotal.get(key)) {
          overallTotals[key] += orderTotal.get(key);
        }
      });
    }

    let amount = 0
    Object.keys(overallTotals).forEach((key, index) => {
      amount += amountTotal[index] * overallTotals[key]
    })

    res.status(200).json({productTotals, overallTotals, amount});
  } catch (error) {
    res.status(500).json(error.message);
  }
};


// 4. CSV Export
const csvExportOrder = async (req, res) => {
  try {
    const { areaId, completeData = false, placedOrders } = req.body;

    if (!areaId) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    // Build query
    const query = { areaId, deleted: false };

    if (!completeData) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfToday, $lte: endOfToday };
    }

    if (placedOrders) {
      query["products"] = { $ne: {} }; 
    } else {
      query["products"] = {}; 
    }
  
    
    const orders = await Order.find(query)
      .populate("shopId", "name address addressLink contactNumber")
      .sort({ createdAt: -1 })

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }


    const formattedOrders = orders.map(order => {
    
      const row = {
        Date: order?.createdAt.toLocaleDateString(),
        Time: order?.createdAt.toLocaleTimeString(),
        Shop: order?.shopId?.name || "",
        Contact: order?.shopId?.contactNumber || "",
        Address: order?.shopId?.address || "",
        AddressLink: order?.shopId?.addressLink || "",
        SR: order?.placedBy
      };

      
      if (placedOrders && order?.products) {
        [...productList].forEach(item => {
          row[item] = order?.products.get(item) || 0;
        });
        [...totalList].forEach(item => {
          row[item] = order?.total.get(item) || 0;
        });
      }
      return row;
    });

    const fields = [
      "Date",
      "Time",
      "Shop",
      "Contact",
      "Address",
      "AddressLink",
      "SR",
      ...(placedOrders ? [...productList, ...totalList] : [])
    ];
    
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedOrders);
    
    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    return res.send(csv);

  } catch (error) {
    console.log(error);
    
    res.status(500).json(error.message);
  }
};

module.exports = {
  createOrder,
  getOrdersByArea,
  softDeleteOrder,
  csvExportOrder,
  dailyReport,
  getSalesReport
};
