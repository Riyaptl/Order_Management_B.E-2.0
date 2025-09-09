const express = require("express")
const router = express.Router()
const { loginAuth, sendOTP, verifyOTP, forgotPassword, resetPassword } = require("../controllers/authController")

// Sign up - OTP send
router.post('/sendOTP', sendOTP)

// Sign up - OTP verify
router.post('/verifyOTP', verifyOTP)

// Login
router.post('/login', loginAuth)

// Forgot password
router.post('/forgotPass', forgotPassword)

// Reset password
router.post('/resetPass', resetPassword)

// // Logout
// router.post('/logout', logoutAuth)

module.exports = router