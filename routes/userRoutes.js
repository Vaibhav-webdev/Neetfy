import express from "express";
import User from "../models/User.js"
import Chemistry from "../models/Chemistry.js";
import Biology from "../models/Biology.js"
import Physics from "../models/Physics.js";

const router = express.Router();

router.get("/chapter", async (req, res) => {
  try {
    let chatpers = Product.find(filters);
    res.json();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
  const search = req.query.search;

  const products = await Product.find({
    title: { $regex: search, $options: "i" }
  });

  res.json(products);

} catch (err) {
  res.status(500).json({ message: err.message });
}
});

router.get("/popular", async (req, res) => {
  const products = await Product.find({ popular: true });
  res.json(products);
});

router.get("/chapters/:dynamic", async (req, res) => {
  try {
    const subjects = req.params.dynamic;
    const chapters = await subjects.find({}, { questions: 0 });
    res.json(chapters);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
