const express = require("express")
const router = express.Router()
const { loginAuth, sendOTP, verifyOTP, forgotPassword, resetPassword, signup } = require("../controllers/authController")

// OTP send
router.post('/sendOTP', sendOTP)

// OTP verify
router.post('/verifyOTP', verifyOTP)

// Login
router.post('/login', loginAuth)

// Sign up
router.post('/signup', signup)

// Forgot password
router.post('/forgotPass', forgotPassword)

// Reset password
router.post('/resetPass', resetPassword)

// // Logout
// router.post('/logout', logoutAuth)

module.exports = router