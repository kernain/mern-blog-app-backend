const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");

const jwtSecret = process.env.JWT_SECRET;

const uploadMiddleware = multer({ dest: "uploads/" });

router.post("/create", uploadMiddleware.single("file"), (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      image: newPath,
      author: info.userId,
    });
    console.log(info);
    res.json({postDoc, message: "Blog Created Successfully"});
  });
});

router.put("/edit", uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
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
      return res.status(400).json({message:"you are not the author"});
    }
    const response = await postDoc.updateOne({
      title,
      summary,
      content,
      image: newPath ? newPath : postDoc.cover,
    });

    res.json({postDoc,message: "Blog Updated Successfully"});
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

    res.json({message: "Blog Deleted Successfully"});
  });
});

module.exports = router;
