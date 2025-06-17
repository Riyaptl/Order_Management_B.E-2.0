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
  getSalesReport,
  getCancelledReport,
  getOrdersBySR,
  statusOrder,
  getRevokedOrders,
  getOrdersByDate,
  csvExportRevokedOrder,
  dailyCallsReport
} = require("../controllers/orderController");

// Daily report
router.post("/report", authenticateUser, authorizeRoles("admin", "sr"), dailyReport);

// Calls report
router.post("/calls/report", authenticateUser, authorizeRoles("admin", "sr"), dailyCallsReport);

// 1. Create an order
router.post("/", authenticateUser, authorizeRoles("admin", "sr", "distributor"), createOrder);

// 2. Read Orders by Area (Admin, Dist access)
router.post("/all/area", authenticateUser, authorizeRoles("admin", "distributor"), getOrdersByArea);

// 2. Read Orders by SR (Admin, Dist access)
router.post("/all/sr", authenticateUser, authorizeRoles("admin", "sr"), getOrdersBySR);

// Read Orders by Date (Admin, Dist access)
router.post("/all/date", authenticateUser, authorizeRoles("admin", "sr", "distributor"), getOrdersByDate);

// Read Revoked Orders by SR (Admin, Dist access)
router.post("/canceled", authenticateUser, authorizeRoles("admin", "sr", "distributor"), getRevokedOrders);

// Update Status Order (Admin, Dist access)
router.post("/update/status", authenticateUser, authorizeRoles("admin", "distributor"), statusOrder);

// 3. Soft Delete Order (Admin access)
router.post("/remove/:id", authenticateUser, authorizeRoles("admin"), softDeleteOrder);

// Get sales report (Admin, Dist access)
router.post("/sales/report", authenticateUser, authorizeRoles("admin", "sr", "distributor"), getSalesReport);

// Get sales report (Admin, Dist access)
router.post("/cancelled/report", authenticateUser, authorizeRoles("admin", "sr", "distributor"), getCancelledReport);

// 4. CSV Export
router.post("/csv/export", authenticateUser, authorizeRoles("admin", "sr", "distributor"), csvExportOrder);

// 4. CSV Export
router.post("/csv/export/revokedOrders", authenticateUser, authorizeRoles("admin", "sr", "distributor"), csvExportRevokedOrder);

module.exports = router;
