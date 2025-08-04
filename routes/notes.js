const express = require("express");
const router = express.Router();
const Note = require("../models/note");

// Simple middleware to ensure the user is authenticated
// Passport adds req.isAuthenticated() to the request object.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized: Please log in." });
}

// --- SECURE NOTE ROUTES ---

// Create a new note for the logged-in user
// We use ensureAuthenticated to protect this route.
router.post("/", ensureAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  // Use the authenticated user's ID from the session (req.user.id).
  // We completely ignore anything the client might send as a userId.
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
    // Find notes where the userId matches the ID of the user from the session.
    const notes = await Note.find({ userId: req.user.id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Delete a specific note by its ID
router.delete("/:noteId", ensureAuthenticated, async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user.id; // The ID of the user making the request.

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // CRITICAL SECURITY CHECK:
    // Ensure the note's owner ID matches the logged-in user's ID.
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