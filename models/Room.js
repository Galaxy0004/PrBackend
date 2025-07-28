const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: ["public", "private"], 
    required: true,
    default: "public"
  },
  accessCode: { 
    type: String, 
    default: "" 
  },
  owner: { 
    type: String, 
    required: true 
  },
  maxParticipants: { 
    type: Number, 
    required: true,
    min: 2,
    max: 10,
    default: 4
  },
  members: { 
    type: [String], 
    default: [] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }

  
});

// In your Room model file
roomSchema.index({ name: 1, members: 1 });
module.exports = mongoose.model("Room", roomSchema);