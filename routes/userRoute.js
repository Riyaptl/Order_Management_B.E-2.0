const express = require("express");
const router = express.Router();
const { getSRDetails, getAllSRs, getAllDists } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const authorizeRoles = require("../middlewares/RoleAuth");

// Only admin should access this
router.post("/srDetails", authenticateUser, authorizeRoles("admin"), getSRDetails);

// Only admin should access this
router.get("/srs", authenticateUser, authorizeRoles("admin"), getAllSRs);

// Only admin should access this
router.get("/dists", authenticateUser, authorizeRoles("admin"), getAllDists);

module.exports = router;
