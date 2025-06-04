const express = require("express");
const router = express.Router();

const authenticateUser = require("../middlewares/JwtAuth");
const authorizeRoles = require("../middlewares/RoleAuth");

const {
  createOrder,
  getOrdersByArea,
  softDeleteOrder,
  csvExportOrder,
  dailyReport,
  getSalesReport
} = require("../controllers/orderController");


// Daily report
router.post("/report", authenticateUser, authorizeRoles("admin", "sr"), dailyReport);

// 1. Create an order
router.post("/", authenticateUser, authorizeRoles("admin", "sr"), createOrder);

// 2. Read Orders by Area (Admin, Dist access)
router.post("/all/orders", authenticateUser, authorizeRoles("admin", "distributor"), getOrdersByArea);

// 3. Soft Delete Order (Admin access)
router.post("/remove/:id", authenticateUser, authorizeRoles("admin"), softDeleteOrder);

// Get sales report (Admin, Dist access)
router.post("/sales/report", authenticateUser, getSalesReport);

// 4. CSV Export
router.post("/csv/export", authenticateUser, authorizeRoles("admin", "distributor"), csvExportOrder);

module.exports = router;
