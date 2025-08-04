const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  user: {
    name: String,
    profilePicture: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
