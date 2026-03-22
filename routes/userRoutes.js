import express from "express";
import User from "../models/User.js"
import Chemistry from "../models/Chemistry.js";
import Biology from "../models/Biology.js"
import Physics from "../models/Physics.js";

const router = express.Router();

router.get("/chapters/:dynamic", async (req, res) => {
  try {
    const subject = req.params.dynamic.toLowerCase();

    let Model;

    if (subject === "chemistry") Model = Chemistry;
    else if (subject === "biology") Model = Biology;
    else if (subject === "physics") Model = Physics;
    else return res.status(400).json({ message: "Invalid subject" });

    const chapters = await Model.find({}, { questions: 0 });
    res.json(chapters);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



export default router;
