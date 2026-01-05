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
    const srs = await User.find(query).select("_id username target");
    res.status(200).json(srs);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const getAllDists = async (req, res) => {
  try {
    const dists = await User.find({ role: "distributor", active: true }).select("_id username");
    res.status(200).json(dists);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Assign target
const assignTarget = async (req, res) => {
  try {
    const {id, month, target} = req.body
    if (!id || !month || target === undefined) {
      return res.status(400).json("Missing required fields");
    }

    const user = User.findOne({_id: id, deleted: false, active: true, role: {$in: ["sr", "tl"]}})
    if (!user) return res.status(404).json("User not found")
    
  
    if (!Array.isArray(user.target)) {
      user.target = [];
    }

   
    let updated = false;

    user.target = user.target.map((entry) => {
      if (entry.has(month)) {
        entry.set(month, target);
        updated = true;
      }
      return entry;
    });

    // If month was not present → push new entry
    if (!updated) {
      const mapObj = new Map();
      mapObj.set(month, target);
      user.target.push(mapObj);
    }

    await user.save()
    res.status(200).json({ message: "Target assigned successfully" });

  } catch (error) {
    res.status(500).json(error.message)
  }
}


module.exports = {
  getSRDetails,
  getAllSRs,
  getAllDists,
  assignTarget
};
