const express = require("express");
const router = express.Router();
const { getSRDetails, getAllSRs, getAllDists, assignTarget } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const authorizeRoles = require("../middlewares/RoleAuth");

// Only admin should access this
router.post("/srDetails", authenticateUser, authorizeRoles("admin", "tl"), getSRDetails);

// Only admin should access this
router.get("/srs", authenticateUser, authorizeRoles("admin", "tl"), getAllSRs);

// Only admin should access this
router.get("/dists", authenticateUser, authorizeRoles("admin", "tl"), getAllDists);

// Assign target - admin access
router.post("/target", authenticateUser, authorizeRoles("admin"), assignTarget);

module.exports = router;
