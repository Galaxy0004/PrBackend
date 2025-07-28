const express = require("express");
const Room = require("../models/Room");
const router = express.Router();

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific room
router.get("/:roomName", async (req, res) => {
  try {
    const room = await Room.findOne({ name: req.params.roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a room
router.post("/", async (req, res) => {
  try {
    const { roomName, type, owner, maxParticipants } = req.body;
    
    if (!roomName || !owner) {
      return res.status(400).json({ error: "Room name and owner are required" });
    }

    const existingRoom = await Room.findOne({ name: roomName });
    if (existingRoom) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    let accessCode = "";
    if (type === "private") {
      accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const newRoom = new Room({
      name: roomName,
      type,
      accessCode,
      owner,
      maxParticipants: maxParticipants || 4,
      members: [owner]
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a room
router.post("/join", async (req, res) => {
  try {
    const { roomName, user, accessCode } = req.body;
    const room = await Room.findOne({ name: roomName });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.type === "private" && room.accessCode !== accessCode) {
      return res.status(403).json({ error: "Invalid access code" });
    }

    if (room.members.includes(user)) {
      return res.status(200).json({ message: "User already in room", room });
    }

    if (room.members.length >= room.maxParticipants) {
      return res.status(400).json({ error: "Room is full" });
    }

    room.members.push(user);
    await room.save();

    res.json({ message: "Joined room successfully", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a room
router.delete("/:roomName", async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ name: req.params.roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;