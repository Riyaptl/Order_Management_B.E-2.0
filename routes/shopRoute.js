const express = require("express");
const router = express.Router();
const fs = require('fs')
const {
  createShop,
  updateShop,
  deleteShop,
  getShopsByArea,
  getShopDetailes,
  getShopOrders,
  csvExportShop,
  shiftArea,
  csvImportShop
} = require("../controllers/shopController");
const authenticateUser = require("../middlewares/JwtAuth");
const checkRole = require("../middlewares/RoleAuth");
const multer = require('multer');
const path = require('path');

// Create uploads folder
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });


// Admin-only access for create, update, delete
router.post("/", authenticateUser, checkRole("admin", "sr"), createShop);
router.post("/:id", authenticateUser, checkRole("admin", "sr"), updateShop);
router.delete("/", authenticateUser, checkRole("admin", "sr"), deleteShop);
router.post("/shift/area", authenticateUser, checkRole("admin", "sr"), shiftArea);

// Public or protected read
router.post("/route/all", authenticateUser, checkRole("admin", "sr"), getShopsByArea);
router.get("/details/:id", authenticateUser, checkRole("admin", "sr"), getShopDetailes);
router.get("/orders/:id", authenticateUser, checkRole("admin", "sr"), getShopOrders);

// 4. CSV Export
router.post("/csv/export", authenticateUser, checkRole("admin", "sr"), csvExportShop);

// 4. CSV Import
router.use(authenticateUser, checkRole("admin"))
router.post("/csv/import/:areaId", upload.single('file'), csvImportShop);

module.exports = router;
