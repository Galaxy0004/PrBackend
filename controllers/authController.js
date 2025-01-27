exports.getCurrentUser = (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

exports.logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Error during logout");
    res.send("Logged out successfully");
  });
};
