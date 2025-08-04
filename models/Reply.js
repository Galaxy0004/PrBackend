const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  text: { type: String, required: true },
  user: {
    name: String,
    profilePicture: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Reply", replySchema);
