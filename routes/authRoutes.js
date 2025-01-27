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
    // Redirect to a success page or send a response
    res.status(200).json({ user: req.user });
  }
);

// Logout user
router.get("/logout", logoutUser);

// Get current authenticated user
router.get("/current_user", getCurrentUser);

module.exports = router;
