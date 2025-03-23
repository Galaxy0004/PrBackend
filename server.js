const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketIo = require("socket.io");

const authRoutes = require("./routes/authRoutes"); // Import auth routes

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust frontend URL if needed
    methods: ["GET", "POST"],
  },
});

// Middleware

const allowedOrigins = ["http://localhost:3000"]; // ✅ Add your frontend URL

app.use(
  cors({
    origin: allowedOrigins, // ✅ Explicitly allow frontend
    credentials: true, // ✅ Allow credentials (cookies, sessions)
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secret for session encryption
    resave: false,
    saveUninitialized: false, // ✅ Set to false (more secure)
    cookie: {
      secure: false, // ❌ Should be true in production (HTTPS)
      httpOnly: true,
      sameSite: "lax", // ✅ Allows frontend requests
    },
  })
);

const chatbotRoutes = require("./routes/chatbotRoutes");
app.use("/chatbot", chatbotRoutes);
const quizRoutes = require("./routes/quizRoutes");
app.use("/quiz", quizRoutes);

// Passport configuration
require("./config/passport"); // Import Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Database connection
require("./config/db"); // Database connection

// Routes
app.use("/auth", authRoutes);

// WebSocket Logic
let rooms = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room
  socket.on("joinRoom", ({ roomName, user }) => {
    let room = rooms.find((r) => r.name === roomName);
    if (!room) {
      room = { name: roomName, users: [] };
      rooms.push(room);
    }

    socket.join(roomName);
    room.users.push({ socketId: socket.id, user });
    console.log(`${user} joined room: ${roomName}`);

    socket.broadcast.to(roomName).emit("userJoined", { user }); // Emit to others

    io.to(roomName).emit("roomData", { roomName, users: room.users });
  });

  // Send a message
  socket.on("sendMessage", ({ roomName, user, message }) => {
    console.log(`Message from ${user} in room ${roomName}: ${message}`);
    io.to(roomName).emit("receiveMessage", { user, message });
  });

  // Send a file
  socket.on("sendFile", ({ roomName, user, file }) => {
    console.log(`File received from ${user} in room ${roomName}`);
    io.to(roomName).emit("receiveMessage", { user, message: "Sent a file.", file });
  });

  // Disconnect
  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      room.users = room.users.filter((u) => u.socketId !== socket.id);
      io.to(room.name).emit("roomData", { roomName: room.name, users: room.users });
    });
    rooms = rooms.filter((room) => room.users.length > 0);
    console.log("User disconnected:", socket.id);
  });
});

// Default route
app.get("/", (req, res) => {
  res.send("Server is running with WebSocket and Auth!");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
