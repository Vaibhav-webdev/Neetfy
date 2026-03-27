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
        { image: data.image_url,
          firstName: data.first_name,
          lastName: data.last_name }
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return res.status(400).send('Error verifying webhook')
  }
})

router.get("/mix", async (req, res) => {
  try {
    const questions = await Chemistry.aggregate([
      
      // 👉 Step 1: Chemistry questions
      { $unwind: "$questions" },
      {
        $project: {
          _id: 0,
          question: "$questions"
        }
      },

      // 👉 Step 2: Physics add karo
      {
        $unionWith: {
          coll: "physics", // 👈 exact collection name
          pipeline: [
            { $unwind: "$questions" },
            {
              $project: {
                _id: 0,
                question: "$questions"
              }
            }
          ]
        }
      },

      // 👉 Step 3: Maths add karo
      {
        $unionWith: {
          coll: "biologies",
          pipeline: [
            { $unwind: "$questions" },
            {
              $project: {
                _id: 0,
                question: "$questions"
              }
            }
          ]
        }
      },

      // 👉 Step 4: Random 20
      { $sample: { size: 20 } }
    ]);

    // 👉 Clean response (sirf question object)
    const final = questions.map(q => q.question);

    res.json({
      success: true,
      count: final.length,
      data: final
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
  // try {
  //   const [chem, phy, math] = await Promise.all([
  //     getRandomQuestionsFromCollection(Chemistry),
  //     getRandomQuestionsFromCollection(Physics),
  //     getRandomQuestionsFromCollection(Biology),
  //   ]);

  //   // sabko combine karo
  //   const allQuestions = [...chem, ...phy, ...math];

  //   // final random 20
  //   const finalQuestions = allQuestions
  //     .sort(() => 0.5 - Math.random())
  //     .slice(0, 20);

  //   res.json(finalQuestions);
  // } catch (err) {
  //   res.status(500).json({ error: err.message });
  // }
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
