import express from "express";
import User from "../models/User.js"
import Chemistry from "../models/Chemistry.js";
import Biology from "../models/Biology.js"
import { clerkClient } from "@clerk/express";
import { verifyWebhook } from "@clerk/express/webhooks";
import Physics from "../models/Physics.js";

const router = express.Router();

router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const evt = await verifyWebhook(req)

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type

    if (eventType === "user.created") {
      await User.findOneAndUpdate(
        { clerkId: evt.data.id },
        {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address,
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          image: evt.data.image_url,
        },
        { upsert: true, new: true }
      );
    }

    if (eventType === "user.deleted") {
      await User.findOneAndDelete({ clerkId: data.id });
    }

    if (evt.type === "user.updated") {
      const data = evt.data;

      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          image: data.image_url, // 👈 updated image
        }
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return res.status(400).send('Error verifying webhook')
  }
})

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

//     convert to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

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
//     res.json({
//       success: true,
//       url: imageUrl,
//       fileId: uploadResponse.fileId,
//     });

//   } catch (error) {
//     return Response.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
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
