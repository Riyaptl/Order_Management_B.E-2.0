const Attendance = require("../models/Attendance");

const getDates = async (req, res) => {
  try {
    const {username} = req.body 

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const dates = await Attendance.find({ username, createdAt: {$gte: startOfMonth, $lte: endOfMonth} }, "date" ).sort({createdAt: -1});
    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const getDetails = async (req, res) => {
  try {
    const {username, date} = req.body
    const details = await Attendance.findOne({ username, date })
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  getDates,
  getDetails
};
