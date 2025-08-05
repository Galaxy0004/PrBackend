const express = require("express");
const router = express.Router();
const Note = require("../models/note");

// Simple middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized: Please log in." });
}

// --- SECURE NOTE ROUTES ---

// Create a new note for the logged-in user
router.post("/", ensureAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  try {
    const note = new Note({ userId, title, content });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to save note" });
  }
});

// Get all notes for the currently logged-in user
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// This is the new route you added to routes/notes.js
router.get("/recent", ensureAuthenticated, async (req, res) => {
  try {
    // ✅ FIX: The .limit(2) below ensures only the last 2 notes are sent.
    const notes = await Note.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(2);

    const notesWithPreview = notes.map(note => ({
      id: note._id,
      title: note.title,
      preview: note.content.substring(0, 50) + "...",
      date: note.createdAt
    }));

    res.json(notesWithPreview);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent notes" });
  }
});

// Delete a specific note by its ID
router.delete("/:noteId", ensureAuthenticated, async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user.id;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (note.userId.toString() !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to delete this note." });
    }

    await Note.findByIdAndDelete(noteId);
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;