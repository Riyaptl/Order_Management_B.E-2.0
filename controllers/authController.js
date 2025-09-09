const User = require("../models/User")
const Attendance = require("../models/Attendance")
const jwt = require("jsonwebtoken")
const sendOTPEmail = require('../utils/email');
const bcrypt = require("bcrypt")
const PendingUser = require("../models/PendingUser");

// Token
const generateToken = (user) => {
    return jwt.sign({
        _id: user._id,
        username: user.username,
        role: user.role
    }, process.env.SECRET)
}

// Login
const loginAuth = async (req, res) => {
    const { username, password, loginLoc } = req.body;
    
    try {
        const usernameTrimmed = username.trim();
        const user = await User.login({ username: usernameTrimmed, password });
        const token = generateToken(user);
        // const isLoggedIn = user.active

        // // Convert current time to IST
        // const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        // const istDate = new Date(nowIST); 
        // const todayIST = istDate.toISOString().slice(0, 10); 

        // let attendance = await Attendance.findOne({ username: user.username, date: todayIST });
        // const loginEntry = {
        //     time: nowIST,
        //     location: {
        //         latitude: loginLoc.latitude,
        //         longitude: loginLoc.longitude
        //     }
        // };

        // if (!attendance) {
        //   attendance = new Attendance({
        //     username: user.username,
        //     date: todayIST,
        //     loginLoc,
        //     loginAt: [loginEntry],
        //     logoutAt: []
        //   });
        // } else {
        //   attendance.loginAt.push(loginEntry);
        // }

        // if (isLoggedIn){
        //   attendance.logoutAt.push(loginEntry)
        // }
                
        // await attendance.save();
        // user.active = true
        await user.save()

        res.status(200).json({
            token,
            message: "Login successful",
            user: user.username,
            role: user.role
        });

    } catch (error) {
        res.status(400).json(error.message);
    }
};


const sendOTP = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;
  const usernameTrimmed = username.trim()
  const roleTrimmed = role.trim()
  const emailTrimmed = email.trim()

  if (password !== confirmPassword)
    return res.status(400).json("Passwords do not match");

  try {

    const existingUser = await User.findOne({ email: emailTrimmed });
    if (existingUser) return res.status(400).json("User already exists");

    const existingUsername = await User.findOne({ username: usernameTrimmed });
    if (existingUsername) return res.status(400).json("Username already exists");

    const existingPending = await PendingUser.findOne({ email: emailTrimmed });
    if (existingPending) await PendingUser.deleteOne({ email: emailTrimmed });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(otp);
    
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    const hashedPassword = await bcrypt.hash(password, salt);

    const pending = new PendingUser({
      username: usernameTrimmed,
      email: emailTrimmed,
      role: roleTrimmed,
      passwordHash: hashedPassword,
      otpHash: hashedOTP,
      otpGeneratedAt: new Date(),
    });

    await pending.save();

    const message = `\nThank you for signing up with our platform. To complete your account verification, please use the following One-Time Password (OTP):\n\n OTP: ${otp}\n\n Please enter this OTP in the designated field on our website to verify your account. Please note that this OTP is valid for a 10 miniutes only.\nIf you did not sign up for an account or have any concerns, please disregard this email.
      \n\nThank you,\nDumyum Chocolates`;
    // await sendOTPEmail({ to: email, subject: "Verify OTP", text: message });

    res.status(200).json({"message": "OTP sent successfully"});
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const pending = await PendingUser.findOne({ email: email.trim() });
    if (!pending) return res.status(404).json("No OTP request found");

    const isExpired =
      (Date.now() - new Date(pending.otpGeneratedAt).getTime()) / 60000 > 10;

    if (isExpired) {
      await PendingUser.deleteOne({ email: email.trim() });
      return res.status(401).json("OTP expired");
    }

    const isMatch = await bcrypt.compare(otp, pending.otpHash);
    if (!isMatch) return res.status(401).json("Invalid OTP");

    const user = new User({
      username: pending.username,
      email: pending.email,
      role: pending.role,
      password: pending.passwordHash,
    });

    await user.save();
    await PendingUser.deleteOne({ email });

    const token = generateToken(user);
    res.status(201).json({ token, "message": "Sign up successful", "user": user.username, "role": user.role });
  } catch (err) {
    res.status(500).json(err.message);
  }
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
  
    const user = await User.findOne({ email }); 
    if (!user) return res.status(404).json("User not found");

    // Generate 6-digit OTP string
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    console.log(otp);

    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    user.otp = hashedOTP;
    user.otpGenerated = new Date();

    await user.save();

    // Send OTP email
    // await sendOTPEmail({
    //   to: email,
    //   subject: "Password Reset OTP - Dumyum Chocolates",
    //   text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.\nDumyum Chocolates`,
    // });

    res.status(200).json({ "message": "OTP sent to your email"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json("Passwords do not match");
  }

  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(404).json("User not found");

    const otpAgeMinutes = (Date.now() - new Date(user.otpGenerated).getTime()) / 60000;
    if (otpAgeMinutes > 10) {
      return res.status(400).json( "OTP expired. Please request again." );
    }

    const validOTP = await bcrypt.compare(otp, user.otp);
    if (!validOTP) {
      return res.status(400).json("Invalid OTP");
    }

    // OTP is valid, reset password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.otp = undefined;
    user.otpGenerated = undefined;

    await user.save();

    res.status(200).json({"message": "Password reset successful"});
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
};

// const logoutAuth = async (req, res) => {
  
//   const { username, logoutLoc } = req.body;
  
//     try {
//         const usernameTrimmed = username.trim();
//         const user = await User.findOne({ username: usernameTrimmed });
//         if (!user) return res.status(404).json("User not found");

//         // Convert current time to IST
//         const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
//         const istDate = new Date(nowIST); 
//         const todayIST = istDate.toISOString().slice(0, 10); 
        
//         let attendance = await Attendance.findOne({ username, date: todayIST });
//         const logoutEntry = {
//             time: nowIST,
//             location: {
//                 latitude: logoutLoc.latitude,
//                 longitude: logoutLoc.longitude
//             }
//         };
//         if (!attendance) {
//             attendance = new Attendance({
//                 username: user.username,
//                 date: todayIST,
//                 loginAt: [],
//                 logoutAt: [logoutEntry]
//             });
//         } else {
//             attendance.logoutAt.push(logoutEntry);
//         }
      
//         await attendance.save();

//         user.active = false
//         await user.save()
//         res.status(200).json({
//             "message": "User Logged Out Successfully"
//         });

//     } catch (error) {
//         res.status(400).json(error.message);
//     }
// };

module.exports = {loginAuth, sendOTP, verifyOTP, forgotPassword, resetPassword}