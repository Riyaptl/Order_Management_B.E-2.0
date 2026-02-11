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
        enum: ['sr', 'admin', "distributor", "me", "tl"], 
        default: 'sr' 
    },
    address: {
        type: String
    },
    name: {
        type: String
    },
    city: {
        type: String
    },
    gst: {
        type: String
    },
    contact: {
        type: String
    },
    target: [
        {
        month: { type: String },
        value: { type: Number }
    }],
    otp: {
        type: String
    },
    otpGeneratedAt: {
        type: Date
    },
    active:{
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String
    },
    invoices: [{
         _id: {
              type: mongoose.Schema.Types.ObjectId,
              auto: true   
            },
        vouchNo: {
            type: String,
            required: true
        },
        billingDate: {
            type: Date,
            required: true
        },
        orderDate: {
            type: Date,
            required: true
        },
        orderTotal: {
            type: String,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        untaxedAmount: {
            type: String,
            required: true
        },
        totalAmount: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["paid", "posted", "due", "partially paid"],
            default: "posted"
        },
        amountPaid: {
            type: String
        },
        paidOn: {
            type: Date
        },
        cn: {
            type: String
        },
        createdBy: {
            type: String
        },
        createdAt: {
            type: Date
        },
        updatedBy: {
            type: String
        },
        updatedAt: {
            type: Date
        }
    }]
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