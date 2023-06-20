const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const bcryptSalt = bcrypt.genSaltSync(10);

const jwtSecret = process.env.JWT_SECRET;


// const Users = require('../models/Users')

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });

    res.json(createdUser);
  } catch (e) {
    res.json({ error: e });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    //1) check if user exists
    const foundUser = await User.findOne({ username });
    if (!foundUser) {
      return res.send({ message: "User does not Exists!" });
    }

    //2) check password if it's correct
    const isPwdCorrect = bcrypt.compareSync(password, foundUser.password);

    if (!isPwdCorrect) {
      return res.send({ message: "Invalid password!" });
    }

    //3) Generate Token
    const token = jwt.sign(
      { userId: foundUser._id, username: foundUser.username },
      jwtSecret
    );
    console.log(token)
    res
      .cookie("token", token, { sameSite: "none", secure: true })
      .status(201)
      .json({
        id: foundUser._id,
        username,
      });

  } catch (e) {
    res.send({ error: e.message });
  }
});


router.get("/profile", async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, (err, userData) => {
      if (err) {
        return res.send({
          message: "Invalid token",
        });
      }
      const { id, username } = userData;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token found");
  }
});

router.post('/logout', async (req, res)=>{
  res.cookie('token', ',' , { sameSite: "none", secure: true }).json({message: "Successfully Logged Out"});
})




module.exports = router;
