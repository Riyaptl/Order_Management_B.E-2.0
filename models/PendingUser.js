const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  role: {type: String, enum: ["sr", "admin", "distributor", "me"]},
  passwordHash: String,
  otpHash: String,
  otpGeneratedAt: Date,
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
