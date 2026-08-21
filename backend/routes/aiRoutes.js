const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

router.post("/generate-tasks", protect, async (req, res) => {
  try {
    const { input } = req.body || {};

    if (!input || !input.trim()) {
      return res.status(400).json({
        message: "Input is required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const prompt = `
You are an AI task management assistant.

Convert the user's natural language into structured tasks.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations.

Each task must contain:
- title: string
- description: string
- priority: "Low", "Medium", or "High"
- dueDate: ISO date string or null

Current date: ${new Date().toISOString().split("T")[0]}

User input:
${input}

Example output:
[
  {
    "title": "Prepare presentation",
    "description": "Prepare the presentation for the client meeting",
    "priority": "High",
    "dueDate": "2026-08-22"
  }
]
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    const cleanedResponse = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const tasks = JSON.parse(cleanedResponse);

    if (!Array.isArray(tasks)) {
      return res.status(500).json({
        message: "AI returned invalid task format",
      });
    }

    const validTasks = tasks.every((task) => {
      return (
        task.title &&
        typeof task.title === "string" &&
        ["Low", "Medium", "High"].includes(task.priority) &&
        (task.dueDate === null ||
          typeof task.dueDate === "string")
      );
    });

    if (!validTasks) {
      return res.status(500).json({
        message: "AI returned invalid task data",
      });
    }

    res.json({
      tasks,
    });
  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      message: "Failed to generate tasks",
      error: error.message,
    });
  }
});

module.exports = router;