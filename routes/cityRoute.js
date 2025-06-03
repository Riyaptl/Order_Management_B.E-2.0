const express = require("express");
const {
  updateCity,
  deleteCity,
  getAllCities,
  getCities,
  csvExportCity,
  createCity
} = require("../controllers/cityController");

const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth"); 

const router = express.Router();

// Admin-only
router.get("/admin", authenticateUser, checkRole("admin"), getCities);
router.post("/", authenticateUser, checkRole("admin"), createCity);
router.post("/:id", authenticateUser, checkRole("admin"), updateCity);
router.delete("/:id", authenticateUser, checkRole("admin"), deleteCity);

// Public (or authenticated)
router.get("/", authenticateUser, getAllCities);

// CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin"), csvExportCity);



module.exports = router;
