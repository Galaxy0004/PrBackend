const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use `gemini-1.5-pro` instead of `gemini-pro`
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate response using correct format
    const result = await model.generateContent({
      contents: [{ parts: [{ text: userMessage }] }]
    });

    const reply = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get chatbot response" });
  }
});

module.exports = router;
