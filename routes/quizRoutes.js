const express = require("express");
const { generateQuiz } = require("../controllers/quizController");

const router = express.Router();

// Route for generating quiz
router.post("/generate-quiz", generateQuiz);

module.exports = router;
