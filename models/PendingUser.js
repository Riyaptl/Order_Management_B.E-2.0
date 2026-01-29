const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  address: {
        type: String
    },
  contact: {
        type: String
    },
  role: {type: String, enum: ["sr", "admin", "distributor", "me", "tl"]},
  passwordHash: String,
  otpHash: String,
  otpGeneratedAt: Date,
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
