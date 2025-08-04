const mongoose = require("mongoose");

const studyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  timeSpent: {
    type: Number, // In hours
    required: true,
  },
});

module.exports = mongoose.model("StudyLog", studyLogSchema);
