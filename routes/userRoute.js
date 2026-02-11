const express = require("express");
const router = express.Router();
const { getSRDetails, getAllSRs, getAllDists, assignTarget, createDist, getDists, editDists, statusDists } = require("../controllers/userController");
const authenticateUser = require("../middlewares/JwtAuth");
const authorizeRoles = require("../middlewares/RoleAuth");

// create distributor
router.post("/dist", authenticateUser, authorizeRoles("admin"), createDist);

// read distributors
router.post("/dist/read", authenticateUser, authorizeRoles("admin", "tl"), getDists);

// update distributors
router.post("/dist/edit/:id", authenticateUser, authorizeRoles("admin"), editDists);

// activate / inactivate distributor
router.post("/dist/status/:id", authenticateUser, authorizeRoles("admin"), statusDists);

// Only admin should access this
router.post("/srDetails", authenticateUser, authorizeRoles("admin", "tl"), getSRDetails);

// Only admin should access this
router.get("/srs", authenticateUser, authorizeRoles("admin", "tl"), getAllSRs);

// Only admin should access this
router.get("/dists", authenticateUser, authorizeRoles("admin", "tl", "sr"), getAllDists);

// Assign target - admin access
router.post("/target", authenticateUser, authorizeRoles("admin"), assignTarget);

module.exports = router;
