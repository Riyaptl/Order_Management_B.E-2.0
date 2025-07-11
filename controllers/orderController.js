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

    const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const startOfMonth = new Date(nowIST); 
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfDay = new Date(nowIST);
    endOfDay.setHours(23, 59, 59, 999);

    // Build Query
    const query = {
      placedBy: username,
      products: { $ne: {} },
      createdAt: { $gte: startOfMonth, $lte: endOfDay },
      deleted: false,
      type: "order"
    }

    const orders = await Order.find(query);

    const orderKeys = ["Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g"];
    const keysToReport = ["Ordered Regular 50g", "Ordered Coffee 50g", "Ordered Regular 25g", "Ordered Coffee 25g", "Cancelled Regular 50g", "Cancelled Coffee 50g", "Cancelled Regular 25g", "Cancelled Coffee 25g"];
    const dailySummary = {};

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0]; // format: YYYY-MM-DD

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          ...Object.fromEntries(keysToReport.map((key) => [key, 0])),
        };
      }

      orderKeys.forEach((baseKey) => {
        const qty = order.total?.get(baseKey) || 0;

        if (order.status === 'canceled') {
          const cancelKey = `Cancelled ${baseKey}`;
          dailySummary[dateKey][cancelKey] += qty;
        } else {
          const orderKey = `Ordered ${baseKey}`;
          dailySummary[dateKey][orderKey] += qty;
        }
      });
      });

    // Convert object to array sorted by date
    const reportList = Object.values(dailySummary).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({ totalSummary: reportList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const dailyCallsReport = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username is required" });

    const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const startOfMonth = new Date(nowIST); 
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfDay = new Date(nowIST);
    endOfDay.setHours(23, 59, 59, 999);

    // Build Query
    const query = {
      placedBy: username,
      createdAt: { $gte: startOfMonth, $lte: endOfDay },
      deleted: false,
      status: {$ne: "canceled"},
      type: "order"
    }

    const orders = await Order.find(query);
    const dailySummary = {};

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      
      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          pc: 0,
          tc: 0,
        };
      }
      
      const isEmpty =
    !(order.products instanceof Map) ||
    [...order.products.values()].filter((qty) => qty > 0).length === 0;

    if (!isEmpty) {
        dailySummary[dateKey].pc += 1;
      }
      dailySummary[dateKey].tc += 1;
    });

    // Convert object to array sorted by date
    const reportList = Object.values(dailySummary).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    res.json({ totalCalls: reportList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 1. Create Order
const createOrder = async (req, res) => {
  try {
    const { shopId, areaId, products, placedBy, location, paymentTerms, remarks, orderPlacedBy, type="order", date } = req.body;

    const createdBy = req.user.username;
    const finalPlacedBy = placedBy || createdBy

    const areaExists = await Area.findOne({ _id: areaId, deleted: { $in: [false, null] } });
    const shopExists = await Shop.findOne({ _id: shopId, deleted: { $in: [false, null] } });
    if (!areaExists || !shopExists) return res.status(400).json("Invalid area or shop ID");

    let data = { shopId, areaId, placedBy: finalPlacedBy, products, createdBy, location, paymentTerms, remarks, orderPlacedBy, type, createdAt: date }

    // Calculate total if products exist
    let total = {}
    if (Object.keys(products).length !== 0) {

      // Mapping of product keys to their respective total category
      const totalMapping = {
        "Regular 50g": ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g"],
        "Coffee 50g": ["Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g"],
        "Regular 25g": ["Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Orange 25g", "Mint 25g"],
        "Coffee 25g": ["Classic Coffee 25g", "Dark Coffee 25g", "Intense Coffee 25g", "Toxic Coffee 25g"]
      };

      // Calculate total object
      total = {
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

    if (Object.keys(products).length !== 0) {

      let shopData = { placedBy: finalPlacedBy, products, total, paymentTerms, remarks, orderPlacedBy, createdAt: date, orderId: order._id, type }
      if (!shopExists.orders) {
        shopExists.orders = []
      }
      shopExists.orders.push(shopData)
      if (shopExists.orders.length > 3) {
        shopExists.orders.shift()
      }
    }
    // shopExists.visitedAt = new Date(Date.now()).toLocaleDateString("en-IN", {
    //   timeZone: "Asia/Kolkata",
    // });
    shopExists.visitedAt = date
    
    await shopExists.save()
  
    await order.save();
    res.status(201).json({ "message": "Order created successfully" });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Soft Delete Order (Admin only)
const softDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user.username;

    const order = await Order.findOne({_id: id, deleted: false});    
    if (!order || order.deleted) return res.status(404).json("Order not found or already deleted");

    order.deleted = true;
    order.deletedBy = deletedBy;
    order.deletedAt = new Date();

    // remove from shop orders history
    const shopExists = await Shop.findOne({_id: order.shopId})
    shopExists.orders = shopExists.orders.filter(
      (o) => o.orderId.toString() !== order._id.toString()
    );
    await shopExists.save()
    await order.save();

    res.status(200).json("Order deleted successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Update Status Order 
const statusOrder = async (req, res) => {
  try {
    const { ids, status, reason } = req.body;

    ids.forEach(async (id) => {
      const order = await Order.findOne({_id: id, deleted: false});
      if (!order ) return res.status(404).json("Order not found");
  
      if (order.status === 'pending') {
        order.status = status;
      }
      order.canceledReason = reason   
      order.statusUpdatedBy = req.user.username;
      order.statusUpdatedAt = Date.now();
      
      // update in shop order history
      const shopExists = await Shop.findOne({_id: order.shopId})
      const targetOrder = shopExists.orders.find(
        (o) => o.orderId.toString() === order._id.toString()
      );

      if (targetOrder) {
        targetOrder.status = order.status;
        targetOrder.statusUpdatedAt = order.statusUpdatedAt;
        targetOrder.canceledReason = order.canceledReason;
        await shopExists.save()
      }
      await order.save();
    })

    res.status(200).json("Order status updated successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// date query
const getDateQuery = (query, completeData, date="", month) => {
  try {
    if (!completeData && !date) {

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfToday, $lte: endOfToday };
    } else if (completeData) {
      const istOffsetMs = 5.5 * 60 * 60 * 1000; 
      const now = new Date();
      const startOfMonthIST = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0) - istOffsetMs);
      const endOfMonthIST = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) - istOffsetMs);

      query.createdAt = { $gte: startOfMonthIST, $lte: endOfMonthIST };
    }else if (date) {
      const istOffsetMs = 5.5 * 60 * 60 * 1000; 
      const [year, month, day] = date.split("-").map(Number);
      const istStartofDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - istOffsetMs);
      const istEndofDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - istOffsetMs);
      query.createdAt = { $gte: istStartofDay, $lte: istEndofDay };
    } 

    // set month passed
    if (month){
      const now = new Date();
      const year = now.getFullYear();

      // Step 2: Convert month name (e.g., "June") to month number (0-indexed)
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

      // Step 3: Build IST start and end of month
      const startIST = new Date(year, monthIndex, 1, 0, 0, 0, 0);
      const endIST = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

      // Step 4: Convert to UTC
      const startUTC = new Date(startIST.getTime() );
      const endUTC = new Date(endIST.getTime());
      query.createdAt = { $gte: startUTC, $lte: endUTC };
    }
    

    return query
    
  } catch (error) {
    return
  }
}

// paginated orders
const paginatedOrders = async (page, limit, query) => {
  try {
    // Pagination params
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate("shopId", "name address contactNumber addressLink areaName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
      
    // Optional: total count for frontend pagination controls
    const totalOrders = await Order.countDocuments(query);

    return {orders, totalOrders, pageNum}

  } catch (error) {
    return error
  }
}

// orders  by area
const getOrdersByArea = async (req, res) => {
  try {
    const { areaId, completeData = false, page = 1, limit = 20, placedOrders, month } = req.body;

    if (!areaId) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    if (completeData && month){
      return res.status(404).jaon({message: "Invalid Entry"})
    }

    // Build query
    const query_prev = { areaId, deleted: false, status: {$ne: 'canceled' } };
    if (req.user.role === "sr"){
      query_prev.placedBy = req.user.username
    }

    const query = getDateQuery(query_prev, completeData, "", month)

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }

    // get paginated orders
    const {orders, totalOrders, pageNum} = await paginatedOrders(page, limit, query);

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

// 2. get orders- placed by
const getOrdersBySR = async (req, res) => {
  try {
    const { username, completeData = false, page = 1, limit = 60, placedOrders, month } = req.body;
    
    if (!username) {
      return res.status(404).json("SR name is required");
    }

    if (completeData && month){
      return res.status(404).jaon({message: "Invalid Entry"})
    }

    // Build query
    const query_prev = { placedBy: username, deleted: false, status: {$ne: "canceled"} };

    const query = getDateQuery(query_prev, completeData, "", month)

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }

    
    // get paginated orders
    const {orders, totalOrders, pageNum} = await paginatedOrders(page, limit, query);

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

// Orders by date
const getOrdersByDate = async (req, res) => {
  try {
  
    const { username, page = 1, limit = 60, placedOrders, date, dist="" } = req.body;

    // Build query
    const query_prev = { deleted: false, status: {$ne: "canceled"} };
    if (username) {
      query_prev.placedBy = username
    }

    const query = getDateQuery(query_prev, false, date, "")

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }

    if (dist) {
      if (username) return res.status(404).json("Invalid Entry")
      const areas = await Area.find({distributor: dist, deleted: {$in: [false, null]}}, {_id: 1})
      const areaIds = []
      areas.forEach((obj) => areaIds.push(obj._id))
      query.areaId = {$in: areaIds}
    }

    // get paginated orders
    const {orders, totalOrders, pageNum} = await paginatedOrders(page, limit, query);

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

//  get canceled/ deleted orders - placed by
const getRevokedOrders = async (req, res) => {
  try {
    const { username, completeData = true, page = 1, limit = 60, deleted , date, dist_username } = req.body;
    
    // Build query
    const query_prev = { deleted };

    if (!deleted){
      query_prev.status = "canceled"
    }

    if (!completeData) {
      query_prev.placedBy = username
    }

    if (dist_username) {
      const areaIds = await Area.find({ distributor: dist_username }, "id")
      query_prev["areaId"] = { $in: areaIds }
    }

    let query
    if (date) {
      query = getDateQuery(query_prev, false, date, "")
    } else {
      query = getDateQuery(query_prev, true, "", "")

    }
    
    // get paginated orders
    const {orders, totalOrders, pageNum} = await paginatedOrders(page, limit, query);
    
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

const getReport = async (orders) => {
  try {
    const keysToReport = ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g",
      "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
      "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g",
      "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
      "Intense Coffee 25g", "Toxic Coffee 25g"]

    const totalList = [
      "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g"
    ];

    const amountTotal = [40, 50, 27, 30] // PRICE
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

    const report = { productTotals, overallTotals, amount }
   return report
  } catch (error) {
    return error
  }
}


const buildReportQuery = async (dist_username, placed_username, completeData, date, month) => {
  try {
    // Build query
    const query_prev = { deleted: false, products: { $ne: {} }};

    // Get area ids, if distributor
    if (dist_username) {
      const areaIds = await Area.find({ distributor: dist_username }, "id")
      query_prev["areaId"] = { $in: areaIds }
    }

    if (placed_username) {
      query_prev["placedBy"] = placed_username
    }

    // Date query
    const query = await getDateQuery(query_prev, completeData, date, month)

    return query
  } catch (error) {
    return error
  }
}

// get orders for sales report
const getSalesReport = async (req, res) => {
  try {
    const { dist_username, completeData=false, placed_username, date, month, areaId } = req.body;

    if (completeData && date) {
      return res.status(404).jaon({message: "Invalid Entry"})
    }

    if ((completeData || date) && month){
      return res.status(404).jaon({message: "Invalid Entry"})
    }

    const query = await buildReportQuery(dist_username, placed_username, completeData, date, month)

    if (areaId){
      query.areaId = areaId
    }

    // For Order type
    const order_query = {...query, type: "order", status: {$ne: 'canceled'}}
    const order_orders = await Order.find(order_query, { products: 1, total: 1 })
    const saleReport = await getReport(order_orders)

    // For replacement type
    const replcement_query = {...query, type: "replacement", status: {$ne: 'canceled'}}
    const replacement_orders = await Order.find(replcement_query, { products: 1, total: 1 })
    const saleReplaceReport = await getReport(replacement_orders)
    
    res.status(200).json({ saleReport, saleReplaceReport });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// get orders for sales report
const getCancelledReport = async (req, res) => {
  try {
    const { dist_username, completeData=false, placed_username, date, month } = req.body;

    if (completeData && date) {
      return res.status(404).jaon({message: "Invalid Entry"})
    }

    if ((completeData || date) && month){
      return res.status(404).jaon({message: "Invalid Entry"})
    }
    
    const query = await buildReportQuery(dist_username, placed_username, completeData, date, month)

    // For Order type
    const order_query = {...query, type: "order", status: 'canceled'}
    const order_orders = await Order.find(order_query, { products: 1, total: 1 })
    const cancelledReport = await getReport(order_orders)

    // For replacement type
    const replcement_query = {...query, type: "replacement", status: 'canceled'}
    const replacement_orders = await Order.find(replcement_query, { products: 1, total: 1 })
    const cancelledReplaceReport = await getReport(replacement_orders)
    
    res.status(200).json({ cancelledReport, cancelledReplaceReport });

  } catch (error) {
    res.status(500).json(error.message);
  }
};


// CSV
const prepareCSV = async (orders, placedOrders) => {
  try {
    
    const formattedOrders = orders.map(order => {
      const date = new Date(order.createdAt);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const created_date = `${day}/${month}/${year} ${hours}:${minutes}`;

      const row = {
        Date: order?.createdAt.toLocaleDateString(),
        Time: order?.createdAt.toLocaleTimeString(),
        Shop: order?.shopId?.name || "",
        Contact: order?.shopId?.contactNumber || "",
        Address: order?.shopId?.address || "",
        AddressLink: order?.shopId?.addressLink || "",
        SR: order?.placedBy,
        "Created At": created_date
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
      "Created At",
      ...(placedOrders ? [...productList, ...totalList] : [])
    ];


    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedOrders);

    return csv
  } catch (error) {
    return error
  }
}

// 4. CSV Export
const csvExportOrder = async (req, res) => {
  try {
    const { areaId, username, completeData = false, placedOrders, date } = req.body;

    if (completeData && date) {
      return res.status(400).json({ message:"Invalid entry" });
    }
    if (areaId && (username || date)) {
      return res.status(400).json({ message:"Invalid entry" });
    }
    if (!areaId && !(username || date)) {
      return res.status(400).json({ message:"Route, SR or Date is required" });
    }

    // Build query
    const query_prev = { deleted: false };

    if (areaId){
      query_prev.areaId = areaId
    }
    if (username) {
      query_prev.placedBy = username
    }
    
    const query = getDateQuery(query_prev, completeData, date)

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

    const csv = await prepareCSV(orders, placedOrders)

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};

const csvExportRevokedOrder = async (req, res) => {
  try {
    const { username, completeData = true, deleted , date } = req.body;
    
    const query_prev = { deleted };

    if (!deleted){
      query_prev.status = "canceled"
    }

    if (!completeData) {
      query_prev.placedBy = username
    }

    let query
    if (date) {
      query = getDateQuery(query_prev, false, date)
    } else {
      query = getDateQuery(query_prev, true, "")

    }

    const orders = await Order.find(query)
      .populate("shopId", "name address addressLink contactNumber")
      .sort({ createdAt: -1 })

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    const csv = await prepareCSV(orders, true)

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = {
  createOrder,
  getOrdersByArea,
  softDeleteOrder,
  csvExportOrder,
  dailyReport,
  getSalesReport,
  getCancelledReport,
  getOrdersBySR,
  statusOrder,
  getRevokedOrders,
  getOrdersByDate,
  csvExportRevokedOrder,
  dailyCallsReport
};
