import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionId: Number,
  question: String,
  options: [String],
  correctAnswer: Number, // index of correct option
});

const biologySchema = new mongoose.Schema({
  chapterId: Number,
  title: String,
  status: String,
  side: String,
  icon: String,
  questions: [questionSchema], // 👈 embedded questions
});

const Biology = mongoose.model("Biology", biologySchema);

export default Biology;
