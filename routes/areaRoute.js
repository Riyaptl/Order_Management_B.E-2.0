const express = require("express");
const {
  createArea,
  updateAreaName,
  deleteArea,
  getAllAreas,
  getAreas,
  csvExportArea
} = require("../controllers/areaController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 

const router = express.Router();

// Admin-only
router.get("/admin", authenticateUser, checkRole("admin"), getAreas);
router.post("/", authenticateUser, checkRole("admin"), createArea);
router.post("/:id", authenticateUser, checkRole("admin"), updateAreaName);
router.post("/delete/one/:id", authenticateUser, checkRole("admin"), deleteArea);

// Public (or authenticated)
router.post("/names/all", authenticateUser, getAllAreas);

// CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin"), csvExportArea);



module.exports = router;
