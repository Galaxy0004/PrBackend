const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routes/authRoutes"); // Import auth routes

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secret for session encryption
    resave: false,
    saveUninitialized: true,
  })
);

// Passport configuration
require("./config/passport"); // Import Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Database connection
require("./config/db"); // Database connection

// Routes
app.use("/auth", authRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
