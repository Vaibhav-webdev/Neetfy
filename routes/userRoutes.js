import express from "express";
import User from "../models/User.js"
import Chemistry from "../models/Chemistry.js";
import Biology from "../models/Biology.js"
import { clerkClient } from "@clerk/express";
import Physics from "../models/Physics.js";

const router = express.Router();

// ── Auth Middleware ──────────────────────────────────────── ← ADD
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const payload = await clerkClient.verifyToken(token);
    req.clerkId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Auth Sync Route ──────────────────────────────────────── ← ADD
// Yeh route signup aur login dono ke baad call hoga
router.post("/auth/sync", requireAuth, async (req, res) => {
  try {
    const clerkUser = await clerkClient.users.getUser(req.clerkId);

    const email    = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name     = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
    const imageUrl = clerkUser.imageUrl ?? "";

    // agar user hai to update karo, nahi hai to naya banao — duplicate kabhi nahi banega
    const user = await User.findOneAndUpdate(
      { clerkId: req.clerkId },
      { $set: { email, name, imageUrl } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

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

// router.post("/api/upload-profile", async (req, res) => {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return Response.json({ error: "No file provided" }, { status: 400 });
//     }

    // convert to buffer
    // const bytes = await file.arrayBuffer();
    // const buffer = Buffer.from(bytes);

    // 🔥 upload to ImageKit
    // const uploadResponse = await imagekit.upload({
    //   file: buffer,
    //   fileName: `profile_${Date.now()}.jpg`,
    //   folder: "/profiles",
    // });

    // const imageUrl = uploadResponse.url;

    // 🗄️ SAVE TO DATABASE (example)
    // 👉 yahan tum apna DB use karo (MongoDB / Prisma / etc.)
    /*
    await db.user.update({
      where: { id: userId },
      data: { photo: imageUrl },
    });
    */

    // 🔥 response send
  //   res.json({
  //     success: true,
  //     url: imageUrl,
  //     fileId: uploadResponse.fileId,
  //   });

  // } catch (error) {
  //   return Response.json(
  //     { error: error.message },
  //     { status: 500 }
  //   );
  // }
// })
router.get("/questions/:subject/:chapter", async (req, res) => {
  try {
    const subject = req.params.subject.toLowerCase();
    const chapter = req.params.chapter;

    const models = {
      chemistry: Chemistry,
      biology: Biology,
      physics: Physics
    };

    const Model = models[subject];

    if (!Model) {
      return res.status(400).json({ message: "Invalid subject" });
    }

    const questions = await Model.find({
      title: { $regex: `^${chapter}$`, $options: "i" }
    });

    res.json(questions);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
