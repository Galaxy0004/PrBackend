const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/generate", async (req, res) => {
  const { topic, difficulty } = req.body;

  if (!topic || !difficulty) {
    return res.status(400).json({ error: "Topic and difficulty are required." });
  }

  try {
    // CHANGE 1: Use the more efficient 'flash' model suitable for the free tier
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // A concise prompt is good for the free tier
    const prompt = `
      Generate a short, 3-question, ${difficulty}-level quiz about "${topic}".
      The JSON output must contain a root key "questions" which is an array of objects.
      Each object must have a "question" string, an "options" array of 4 strings, and a correct "answer" string.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const quizData = JSON.parse(responseText);

    res.json(quizData);

  } catch (error) {
    // CHANGE 2: Specifically handle the rate limit error
    if (error.response && error.response.status === 429) { // Access status via error.response for the client library
      console.error("Rate limit exceeded:", error.message);
      return res.status(429).json({
        error: "Too many requests. You have exceeded the free tier limit. Please wait a bit before trying again."
      });
    }

    // General error handling
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Failed to generate quiz. The model may be busy or an error occurred." });
  }
});

module.exports = router;