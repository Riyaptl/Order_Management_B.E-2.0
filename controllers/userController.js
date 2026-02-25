const User = require("../models/User");
const bcrypt = require("bcrypt")
const Area = require("../models/Area");
const crypto = require("crypto");


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

// create distributor
const createDist = async (req, res) => {
  try {
    let {
      username,
      email,
      gst,
      password,
      confirmPass,
      city,
      address,
      contact,
      name
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPass ||
      !city ||
      !address ||
      !contact ||
      !name
    ) {
      return res.status(400).json({
        message: "All fields are compulsory"
      });
    }

    username = username.trim();
    email = email.trim();
    if (gst) gst = gst.trim();
    password = password.trim();
    confirmPass = confirmPass.trim();
    city = city.trim();
    address = address.trim();
    name = name.trim();
    contact = contact.trim();

    if (password !== confirmPass) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const firmName = name
    const partyName = username
    await User.create({
      username: firmName,
      email,
      gst,
      password: hashedPassword,
      city,
      address,
      contact,
      name: partyName,
      role: "distributor",
      createdBy: req.user.username
    });

    return res.status(201).json({
      message: "Distributor created successfully",
    });

  } catch (error) {
    console.error("Create Distributor Error:", error);
    res.status(500).json(error.message);
  }
};

// Read distributors
const getDists = async (req, res) => {
  try {
    const {active, city} = req.body

    let query = { role: "distributor"}

    if (city){
      query.city = city
    } 
    if(active) {
      query.active = active
    } 

    const dists = await User.find(query).sort({createdAt: -1})

    res.status(200).json(dists);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


// edit distributor
const editDists = async (req, res) => {
  try {
    const { id } = req.params;    
    
    let {
      name,
      confirmPass,
      password,
      email,
      gst,
      city,
      address,
      contact,
    } = req.body; 

    const updateFields = {};
    
    if (email) updateFields.email = email.trim();
    if (gst) updateFields.gst = gst.trim();
    if (password) updateFields.password = password.trim();
    if (confirmPass) updateFields.confirmPass = confirmPass.trim();
    if (city) updateFields.city = city.trim();
    if (address) updateFields.address = address.trim();
    if (contact) updateFields.contact = contact.trim();
    if (name) updateFields.name = name.trim();

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }
    
    const updatedDistributor = await User.findOneAndUpdate(
      {
        _id: id,
        role: "distributor",
      },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedDistributor) {
      return res.status(404).json({
        message: "Distributor not found"
      });
    }

    res.status(200).json({
      message: "Distributor updated successfully",
    });

  } catch (error) {
    console.error("Edit Distributor Error:", error);
    res.status(500).json(error.message);
  }
};

// activate / deactivate distributor
const statusDists = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // validate boolean
    if (typeof active !== "boolean") {
      return res.status(400).json({
        message: "`active` must be true or false",
      });
    }

    // find distributor first
    const distributor = await User.findOne({
      _id: id,
      role: "distributor",
    });

    if (!distributor) {
      return res.status(404).json({
        message: "Distributor not found",
      });
    }

    // 🔴 IF DEACTIVATING
    if (active === false) {
      await Area.updateMany(
        { distributor: distributor.username },
        { $set: { distributor: "" } }
      );

      // 2️⃣ Set random hashed password
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      distributor.password = hashedPassword;
    }

    // 3️⃣ Update active status
    distributor.active = active;
    await distributor.save();

    res.status(200).json({
      message: `Distributor ${active ? "activated" : "deactivated"} successfully`,
    });

  } catch (error) {
    console.error("Set Distributor Active Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  getSRDetails,
  getAllSRs,
  getAllDists,
  assignTarget,
  createDist,
  getDists,
  editDists,
  statusDists
};
