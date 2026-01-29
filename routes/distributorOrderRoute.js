const express = require("express");
const {
  createDistributorOrder,
  updateDistributorOrder,
  readDistributorOrders,
  deleteDistributorOrder,
  deliveredDistributorOrder,
  updateDeliveryDetails
} = require("../controllers/distributorOrderController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 

const router = express.Router();

// Admin-only
router.post("/orders/read", authenticateUser, readDistributorOrders);
router.post("/", authenticateUser, createDistributorOrder);
router.post("/status", authenticateUser, updateDistributorOrder);
router.post("/update", authenticateUser, checkRole("admin"), updateDeliveryDetails);
// router.post("/deliever/:id", authenticateUser, deliveredDistributorOrder);
router.post("/delete/:id", authenticateUser, checkRole("admin"), deleteDistributorOrder);

module.exports = router;
