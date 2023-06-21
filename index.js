const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require("cookie-parser")
require("dotenv").config()
const db = require("./config/db");
const fs = require('fs');
const cloudinary = require("cloudinary")
db.connection
  .once("open", () => console.log("connected to db"))
  .on("error", (err) => console.log("error connecting db -->", err));

app.use(express.json())
app.use(cookieParser())
app.use(cors({origin: true, credentials: true}));
app.use('/uploads', express.static(__dirname + '/uploads'));

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

app.get("/", (req,res)=>{
    res.json("ok")
})

app.use('/', require('./routes/index.js'))


app.listen(4040)