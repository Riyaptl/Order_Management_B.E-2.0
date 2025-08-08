const User = require("../models/User");

const getSRDetails = async (req, res) => {
  try {
    const {username} = req.body
    const sr = await User.findOne({ role: {$in : ["sr", "tl"] }, username });
    if (!sr) return res.status(404).json("SR not found")
    res.status(200).json(sr);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const getAllSRs = async (req, res) => {
  try {
    const query = { role: {$in : ["sr", "tl"] }, active: true }
    const srs = await User.find(query).select("_id username");
    res.status(200).json(srs);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const getAllDists = async (req, res) => {
  try {
    const dists = await User.find({ role: "distributor" }).select("_id username");
    res.status(200).json(dists);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  getSRDetails,
  getAllSRs,
  getAllDists
};
