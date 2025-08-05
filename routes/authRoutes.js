const express = require("express");
const passport = require("passport");
const { getCurrentUser, logoutUser } = require("../controllers/authController");

const router = express.Router();

// Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Redirect with session persistence
    res.redirect("http://localhost:3000/home");
  }
);

// Get current authenticated user
router.get("/current_user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); // Send user session data
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Logout user
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    // Destroy the session and send a success response
    req.session.destroy();
    res.status(200).json({ message: "Logged out successfully" });
  });
});


module.exports = router;
