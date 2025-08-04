const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ error: "Topic and difficulty are required" });
    }

    // Define the prompt
    const prompt = `
      Generate a quiz with 5 multiple-choice questions on '${topic}' at '${difficulty}' difficulty. 
      Ensure JSON format:
      {
        "questions": [
          {
            "question": "What is ...?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "B"
          }
        ]
      }
    `;

    // Generate response using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);

    if (!result || !result.response) {
      throw new Error("Invalid response from Gemini AI");
    }

    // Extract response text
    let responseText = result.response.text();
    
    console.log("Raw AI Response:", responseText);

    // **Remove triple backticks (```) and 'json' label**
    responseText = responseText.replace(/```json|```/g, "").trim();

    // Parse AI-generated response
    let quiz;
    try {
      quiz = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "AI response was not in valid JSON format." });
    }

    return res.status(200).json({
      message: "Quiz generated successfully!",
      quiz,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};
