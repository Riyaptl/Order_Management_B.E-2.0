const express = require("express")
const router = express.Router()
const { getDates, getDetails } = require("../controllers/attendanceController")
const authenticateUser = require("../middlewares/JwtAuth")
const authorizeRoles = require("../middlewares/RoleAuth")

// get dates
router.post('/dates', authenticateUser, authorizeRoles("admin"), getDates)

// get details
router.post('/details', authenticateUser, authorizeRoles("admin"), getDetails)

module.exports = router