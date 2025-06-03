const City = require("../models/City")
const { Parser } = require("json2csv");


// 1. Create Area
const createCity = async (req, res) => {
  try {
    const { name } = req.body;

    const existingCity = await City.findOne({ name: name.trim() });
    if (existingCity) {
      return res.status(400).json("City with this name already exists");
    }   
    const city = new City({ name: name.trim(), createdBy: req.user.username });
    await city.save();
    res.status(201).json(city);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. Update City
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingCity = await City.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingCity) {
      return res.status(400).json("City with this name already exists");
    }

    const city = await City.findByIdAndUpdate(id, { name: name.trim(), updatedBy: req.user.username, updatedAt: Date.now()}, { new: true });
    
    if (!city) return res.status(404).json("City not found");

    res.status(200).json({"message": "City name updated successfully"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete City (only if no areas)
const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);
    if (!city) return res.status(404).json( "City not found");

    if (city.areas.length > 0) {
      return res.status(400).json("Cannot delete city with areas");
    }

    await City.findByIdAndDelete(id);
    res.status(200).json( {"message": "City deleted"} );
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 4. Read All Area Names Only (as array of strings)
const getAllCities = async (req, res) => {
  try {
    const cities = await City.find({}, 'name'); 
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 5. Read All Area with Pagination
const getCities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 20;
    const skip = (page - 1) * limit;

    const totalCount = await City.countDocuments();
    const cities = await City.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    res.status(200).json({
      cities,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. CSV Export
const csvExportCity = async (req, res) => {
  try {

    const cities = await City.find().sort({ createdAt: -1 })

    const formattedCities = cities.map(city => {
      const row = {
        Name: city?.name || "",
        Areas: city?.areas || "",
        "Created By": city?.createdBy || "",
        "Updated By": city?.updatedBy || "",
      };
      return row;
    });

    const fields = [
      "Name",
      "Created By",
      "Updated By",
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedCities);
       
    res.header("Content-Type", "text/csv");
    res.attachment("cities.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createCity,
  updateCity,
  deleteCity,
  getAllCities,
  getCities,
  csvExportCity
};
