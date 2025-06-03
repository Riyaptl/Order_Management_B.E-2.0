const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const geoSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { _id: false }); 

const timestampWithLocationSchema = new Schema({
  time: { type: Date, required: true },
  location: { type: geoSchema, required: true },
}, { _id: false });

const AttendanceSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  loginAt: [timestampWithLocationSchema],
  logoutAt: [timestampWithLocationSchema],
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
