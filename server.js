const express = require("express");
const dotenv =require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// --- MIDDLEWARE SETUP ---
// This order is very important

// 1. CORS and Body Parser
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// 2. Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production (HTTPS)
    httpOnly: true,
    sameSite: "lax",
  },
}));

// 3. Passport Initialization (MUST be after session)
// This line loads the strategy configuration (e.g., GoogleStrategy)
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// --- API ROUTES ---
// 4. Import and mount all your routes AFTER authentication middleware is ready

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const chatbotRoutes = require("./routes/chatbotRoutes");
app.use("/chatbot", chatbotRoutes);

const quizRoutes = require("./routes/quizRoutes");
app.use("/quiz", quizRoutes);

const studyRoutes = require('./routes/studylogs');
app.use('/api/study', studyRoutes);

const forumRoutes = require("./routes/forum");
app.use("/api/forum", forumRoutes);

const notesRoutes = require("./routes/notes");
app.use("/api/notes", notesRoutes);

const generateQuizRoutes = require("./routes/ssgeneratequiz");
app.use("/api/quiz", generateQuizRoutes);

// Database connection
require("./config/db");

// --- WebSocket Logic ---
let rooms = [];
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ roomName, user }) => {
    let room = rooms.find((r) => r.name === roomName);
    if (!room) {
      room = { name: roomName, users: [] };
      rooms.push(room);
    }
    socket.join(roomName);
    room.users.push({ socketId: socket.id, user });
    console.log(`${user} joined room: ${roomName}`);
    socket.broadcast.to(roomName).emit("userJoined", { user });
    io.to(roomName).emit("roomData", { roomName, users: room.users });
  });

  socket.on("sendMessage", ({ roomName, user, message }) => {
    console.log(`Message from ${user} in room ${roomName}: ${message}`);
    io.to(roomName).emit("receiveMessage", { user, message });
  });

  socket.on("sendFile", ({ roomName, user, file }) => {
    console.log(`File received from ${user} in room ${roomName}`);
    io.to(roomName).emit("receiveMessage", { user, message: "Sent a file.", file });
  });

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