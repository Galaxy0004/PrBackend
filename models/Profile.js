const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  username: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  facebook: {
    type: String,
    default: ""
  },
  twitter: {
    type: String,
    default: ""
  },
  instagram: {
    type: String,
    default: ""
  },
  profileImage: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);