const User = require("../models/User");

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      profile: user.profile || {}
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};

module.exports = {
  getCurrentUser,
  logoutUser
};