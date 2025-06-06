const Shop = require("../models/Shop");
const Area = require("../models/Area");
const Order = require("../models/Order");
const { Parser } = require("json2csv");
const { ObjectId } = require("mongodb");
const fs = require('fs');
const fsPromises = fs.promises;
const csv = require('csv-parser');

// 1. Create Shop
const createShop = async (req, res) => {
  try {
    const { name, address, contactNumber, addressLink, areaId } = req.body;
    const shop = new Shop({ name, address, contactNumber, addressLink, createdBy: req.user.username });
    
    const area = await Area.findOneAndUpdate({_id: areaId, deleted: { $in: [false, null] }}, { $push: { shops: shop._id } }, {new: true});
    if (!area) return res.status(404).json("Area not found");
    
    await shop.save();
    res.status(201).json("Shop created successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. Update Shop (only passed fields)
const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    const allowedFields = ["name", "address", "contactNumber", "addressLink"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    updates["updatedBy"] = req.user.username
    
    const updatedShop = await Shop.findOneAndUpdate({_id: id, deleted: { $in: [false, null] }}, updates, { new: true });
    if (!updatedShop) return res.status(404).json("Shop not found");

    res.status(200).json(updatedShop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete Shop
const deleteShop = async (req, res) => {
  try {
    const { id, areaId } = req.body;
    const deletedShop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }});
    if (!deletedShop) return res.status(404).json("Shop not found");

    const area = await Area.findOneAndUpdate({_id: areaId, deleted: { $in: [false, null] }}, { $pull: { shops: id } }, {new: true});
    if (!area) return res.status(404).json("Area not found");

    deletedShop.area = area.id
    deletedShop.deleted = true 
    deletedShop.deletedBy = req.user.username
    deletedShop.deletedAt = Date.now()
    await deletedShop.save()
    console.log(deletedShop);
    
    res.status(200).json({"message": "Shop deleted and removed from respective route"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 4. Get shops under a specific area
const getShopsByArea = async (req, res) => {
  try {
    const { areaId } = req.body;
    const areaShops = await Area.findOne({_id: areaId, deleted: { $in: [false, null] }}).populate({
      path: "shops",
      select: "name address addressLink contactNumber createdBy updatedBy deleted", 
    });
    if (!areaShops) return res.status(404).json("Area not found");

    const activeShops = areaShops?.shops?.filter((shop) => shop.deleted !== true);

    res.status(200).json({
      shops: activeShops,
    });

   
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 5. Get shop details
const getShopDetailes = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }});

    if (!shop) return res.status(404).json("Shop not found");

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

//  Get shop orders
const getShopOrders = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }}, "orders");
    if (!shop) return res.status(404).json("Shop not found");
        
    if (shop?.orders?.length > 0) {
      shop.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json(shop.orders);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 6. Change area 
const shiftArea = async (req, res) => {
  try {
    const { prevAreaId, newAreaId, id } = req.body;
    const shopObjId  = new ObjectId(id);
    
    const prevArea = await Area.findOneAndUpdate({_id: prevAreaId, deleted: { $in: [false, null] }}, { $pull: { shops: shopObjId } }, {new: true});
    if (!prevArea) return res.status(404).json("Area not found");
    
    const newArea = await Area.findOneAndUpdate({_id: newAreaId, deleted: { $in: [false, null] }}, { $push: { shops: shopObjId } }, {new: true});
    if (!newArea) return res.status(404).json("Area not found");
    
    const areaId = new ObjectId(newAreaId);
    await Order.updateMany({shopId: id}, { $set: { areaId } });
    
    res.status(200).json({"message": "Shop shifted successfully"});

  } catch (error) {
    res.status(500).json(error.message);
  }
};


// 7. CSV Export
const csvExportShop = async (req, res) => {
  try {
    const { areaId } = req.body;

    if (!areaId) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    const area = await Area.findOne({_id: areaId, deleted: { $in: [false, null] } })
      .populate({
      path: "shops",
      select: "name address addressLink contactNumber createdBy updatedBy", 
    }).sort({ createdAt: -1 })
    const shops = area.shops

    const formattedShops = shops.map(shop => {
    
      const row = {
        Name: shop?.name || "",
        Contact: shop?.contactNumber || "",
        Address: shop?.address || "",
      };
      return row;
    });
  
    const fields = [
      "Name",
      "Contact",
      "Address",
    ];
    
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedShops);
       
    res.header("Content-Type", "text/csv");
    res.attachment("shops.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};

const csvImportShop = async (req, res) => {
  const { areaId } = req.params;
  const filePath = req.file.path;
  const shopsToInsert = [];

  try {
    const area = await Area.findOne({_id: areaId, deleted: { $in: [false, null] } });
    if (!area) {
      return res.status(404).json({ "message": 'Area not found' });
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const name = row.name?.trim();
        const address = row.address?.trim() || '';
        const contactNumber = row.contactNumber?.trim() || '';
        const addressLink = row.addressLink?.trim() || '';

        if (name) {
          shopsToInsert.push({
            name,
            address,
            contactNumber,
            addressLink,
            createdBy: req.user.username
          });
        }        
      })
      .on('end', async () => {
        if (shopsToInsert.length === 0) {
          await fsPromises.unlink(filePath);
          return res.status(400).json({ "message": 'No valid rows with "name" field found.' });
        }

        const createdShops = await Shop.insertMany(shopsToInsert);
        
        const shopIds = createdShops.map(shop => shop._id);
        area.shops.push(...shopIds);
        await area.save();

        await fsPromises.unlink(filePath);

        res.status(200).json({ "message": 'CSV imported successfully' });
      });
  } catch (err) {
    if (fs.existsSync(filePath)) await fsPromises.unlink(filePath);
    res.status(500).json(err.message);
  }
}

module.exports = {
  createShop,
  updateShop,
  deleteShop,
  getShopsByArea,
  getShopDetailes,
  csvExportShop,
  shiftArea,
  csvImportShop,
  getShopOrders
};
