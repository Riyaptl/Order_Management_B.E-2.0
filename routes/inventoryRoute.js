const express = require("express")
const router = express.Router()

const authenticateUser = require("../middlewares/JwtAuth")
const authorizeRoles = require("../middlewares/RoleAuth")
const { getInventory, updateStatus, createInventory } = require("../controllers/inventoryController")

// create - for backend calls only
router.post('/', createInventory)

// read inventory
router.get('/read', authenticateUser, getInventory)

// update status
router.post('/status/:id', authenticateUser, authorizeRoles("admin"), updateStatus)

module.exports = router