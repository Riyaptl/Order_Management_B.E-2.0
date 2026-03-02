const express = require("express")
const router = express.Router()

const authenticateUser = require("../middlewares/JwtAuth")
const authorizeRoles = require("../middlewares/RoleAuth")
const { createAnnouncement, updateAnnouncement, getAnnouncement, deleteAnnouncement } = require("../controllers/announcementController")

// create 
router.post('/', authenticateUser, authorizeRoles("admin"), createAnnouncement)

// replace
router.post('/replace/:id', authenticateUser, authorizeRoles("admin"), updateAnnouncement)

// delete
router.post('/delete/:id', authenticateUser, authorizeRoles("admin"), deleteAnnouncement)

// read 
router.get('/read', authenticateUser, getAnnouncement)


module.exports = router