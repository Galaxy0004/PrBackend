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
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("http://localhost:3000"); // Redirect after logout
  });
});

module.exports = router;
