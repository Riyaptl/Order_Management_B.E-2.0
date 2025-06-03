const Area = require("../models/Area")
const { Parser } = require("json2csv");


// 1. Create Area
const createArea = async (req, res) => {
  try {
    const { name, areas, distributor } = req.body;
    let dist_trimmed = distributor
    if (distributor){
      dist_trimmed = distributor.trim()
    }
    // Check if area with the same name already exists
    const existingArea = await Area.findOne({ name: name.trim() });
    if (existingArea) {
      return res.status(400).json("Area with this name already exists");
    }   
    const area = new Area({ name: name.trim(), shops: [], createdBy: req.user.username, areas, distributor:dist_trimmed });
    await area.save();
    res.status(201).json(area);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. Update Area Name
const updateAreaName = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, areas, distributor } = req.body;
    let dist_trimmed = distributor
    if (distributor){
      dist_trimmed = distributor.trim()
    }
    console.log(name, areas, dist_trimmed);
    
    // Check if area with the same name already exists (excluding the current area)
    const existingArea = await Area.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingArea) {
      return res.status(400).json("Area with this name already exists");
    }

    const area = await Area.findByIdAndUpdate(id, { name: name.trim(), areas, distributor: dist_trimmed, updatedBy: req.user.username, updatedAt: Date.now()}, { new: true });
    
    if (!area) return res.status(404).json("Area not found");

    res.status(200).json({"message": "Route updated successfully"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete Area (only if no shops)
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findById(id);
    if (!area) return res.status(404).json( "Area not found");

    if (area.shops.length > 0) {
      return res.status(400).json("Cannot delete area with shops");
    }

    await Area.findByIdAndDelete(id);
    res.status(200).json( {"message": "Route deleted"} );
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 4. Read All Area Names Only (as array of strings)
const getAllAreas = async (req, res) => {
  try {
    const {dist_username} = req.body
    query = {}
    if (dist_username){
      query["distributor"] = dist_username
    }
    const areas = await Area.find(query, 'name'); 
    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 5. Read All Area with Pagination
const getAreas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 20;
    const skip = (page - 1) * limit;

    const totalCount = await Area.countDocuments();
    const areas = await Area.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    res.status(200).json({
      areas,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. CSV Export
const csvExportArea = async (req, res) => {
  try {

    const areas = await Area.find().sort({ createdAt: -1 })

    const formattedAreas = areas.map(area => {
      const row = {
        Name: area?.name || "",
        Areas: area?.areas || "",
        Distributor: area?.distributor || "",
        "Created By": area?.createdBy || "",
        "Updated By": area?.updatedBy || "",
      };
      return row;
    });

    const fields = [
      "Name",
      "Areas",
      "Distributor",
      "Created By",
      "Updated By",
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedAreas);
       
    res.header("Content-Type", "text/csv");
    res.attachment("routes.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createArea,
  updateAreaName,
  deleteArea,
  getAllAreas,
  getAreas,
  csvExportArea
};
