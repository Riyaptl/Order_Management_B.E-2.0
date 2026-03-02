const express = require("express");
const {
  createDistributorOrder,
  updateDistributorOrder,
  readDistributorOrders,
  deleteDistributorOrder,
  deliveredDistributorOrder,
  updateDeliveryDetails,
  getAvgQuantityPerFlavour
} = require("../controllers/distributorOrderController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 

const router = express.Router();

// // create invoice entry
// router.post("/inv", authenticateUser, checkRole("admin"), readDistributorOrders);

// // read invoice entries
// router.post("/inv/read", authenticateUser, checkRole("admin"), readDistributorOrders);

// // edit invoice entry
// router.post("/inv/edit", authenticateUser, checkRole("admin"), readDistributorOrders);

// // cancel invoice entry
// router.post("/inv/cancel", authenticateUser, checkRole("admin"), readDistributorOrders);

// Admin-only
router.post("/orders/read", authenticateUser, readDistributorOrders);
router.post("/", authenticateUser, createDistributorOrder);
router.post("/status", authenticateUser, updateDistributorOrder);
router.post("/update", authenticateUser, checkRole("admin"), updateDeliveryDetails);
// router.post("/deliever/:id", authenticateUser, deliveredDistributorOrder);
router.post("/delete/:id", authenticateUser, checkRole("admin"), deleteDistributorOrder);

// AVG quantity
router.post("/avg", getAvgQuantityPerFlavour);

module.exports = router;
