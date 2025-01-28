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
    res.redirect("http://localhost:3000/home"); // Direct the user to the home page or other pages

  }
);

// Logout user
router.get("/logout", logoutUser);

// Get current authenticated user
router.get("/current_user", getCurrentUser);

module.exports = router;


