const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require("validator");
const bcrypt = require("bcrypt")

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: { 
        type: String, 
        enum: ['sr', 'admin', "distributor", "me"], 
        default: 'sr' 
    },
    otp: {
        type: String
    },
    otpGeneratedAt: {
        type: Date
    },
    active:{
        type: Boolean,
        default: false
    }
}, {timestamps: true});

UserSchema.statics.login = async function({username, password}){
    if (!username || !password){
        throw Error("All fileds must be filled")
    }
    const user = await this.findOne({username})
    if (!user){
        throw Error("Invalid credentials")
    }
    const validated = await bcrypt.compare(password, user.password)
    if (!validated){
        throw Error("Invalid credentials")
    }
    return user
}

module.exports = mongoose.model('User', UserSchema);