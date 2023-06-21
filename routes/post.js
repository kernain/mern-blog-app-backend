const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const DataUriParser = require("datauri/parser.js");
const cloudinary = require("cloudinary");

const jwtSecret = process.env.JWT_SECRET;

const storage = multer.memoryStorage();

const uploadMiddleware = multer({ storage });

router.post("/create", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path, buffer } = req.file;
  const parts = originalname.split(".");
  const ext = "." + parts[parts.length - 1];
  const parser = new DataUriParser();
  const fileUri = parser.format(ext, buffer);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      image: {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      },
      author: info.userId,
    });
    res.json({ postDoc, message: "Blog Created Successfully" });
    // console.log(postDoc)
  });
});

router.put("/edit", uploadMiddleware.single("file"), async (req, res) => {
  let mycloud = null;
  if (req.file) {
    const { originalname, path, buffer } = req.file;
    const parts = originalname.split(".");
    const ext = "." + parts[parts.length - 1];
    const parser = new DataUriParser();
    const fileUri = parser.format(ext, buffer);
    mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
  }

  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor =
      JSON.stringify(postDoc.author) === JSON.stringify(info.userId);
    console.log(postDoc);
    if (!isAuthor) {
      return res.status(400).json({ message: "you are not the author" });
    }
    const response = await postDoc.updateOne({
      title,
      summary,
      content,
      image: mycloud ? {public_id: mycloud.public_id,url: mycloud.secure_url} : postDoc.image,
    });

    res.json({ postDoc, message: "Blog Updated Successfully" });
  });
});

router.get("/get", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

router.get("/get/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, info) => {
    if (err) throw err;
    await Post.deleteOne({ _id: id });

    res.json({ message: "Blog Deleted Successfully" });
  });
});

module.exports = router;
