const express = require("express");
const Question = require("../models/Question");
const Reply = require("../models/Reply");

const router = express.Router();

// Post a question
router.post("/question", async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all questions
router.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single thread with replies
router.get("/question/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    const replies = await Reply.find({ questionId: req.params.id });
    res.json({ question, replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a reply
router.post("/reply", async (req, res) => {
  try {
    const newReply = new Reply(req.body);
    await newReply.save();
    res.status(201).json(newReply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
