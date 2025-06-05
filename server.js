const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const fs = require('fs')
const path = require("path")
const {connection} = require("./config/db")
const authRoute = require("./routes/authRoute")
const authenticateUser = require("./middlewares/JwtAuth");
const cityRoute = require('./routes/cityRoute')
const areaRoute = require('./routes/areaRoute')
const shopRoute = require('./routes/shopRoute')
const orderRoute = require('./routes/orderRoute')
const userRoute = require('./routes/userRoute')
const attendanceRoute = require('./routes/attendanceRoute')
const cors = require('cors');


// Express app
dotenv.config()
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     console.log('OPTIONS headers:', req.headers);
//   }
//   console.log(`Debugging: [${req.method}] ${req.url} Origin: ${req.headers.origin}`);
//   next();
// });

const allowedOrigins = [
  "https://order-management-f-e-2-0-odrngyagc.vercel.app",
  "https://order-management-f-e-2-0.vercel.app",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function(origin, callback) {
    // console.log("In cors option Origin:", origin);
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);  
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// DB connection
connection()
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})

// Auth Route
app.use("/api/auth", authRoute)

// Routes
app.use("/api/city", cityRoute)
app.use("/api/area", areaRoute)
app.use("/api/shop", shopRoute)
app.use("/api/order", orderRoute)
app.use("/api/user", userRoute)
app.use("/api/attendance", attendanceRoute)

