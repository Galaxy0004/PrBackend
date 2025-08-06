const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

// Define the client URL from environment variables for production/development
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Initialize Express app
const app = express();
app.set("trust proxy", 1); // Trust the first proxy
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL, // Use the variable here
    methods: ["GET", "POST"],
  },
});

// --- MIDDLEWARE SETUP ---

// 1. CORS and Body Parser
app.use(
  cors({
    origin: CLIENT_URL, // Use the variable here
    credentials: true,
  })
);
app.use(express.json());

// 2. Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Set to true in production (HTTPS)
      httpOnly: true,
      sameSite: "none", // Use "none" if you have cross-domain issues, but requires secure: true
    },
  })
);

// 3. Passport Initialization (MUST be after session)
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// --- API ROUTES ---
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const chatbotRoutes = require("./routes/chatbotRoutes");
app.use("/chatbot", chatbotRoutes);

const quizRoutes = require("./routes/quizRoutes");
app.use("/quiz", quizRoutes);

const studyRoutes = require("./routes/studylogs");
app.use("/api/study", studyRoutes);

const forumRoutes = require("./routes/forum");
app.use("/api/forum", forumRoutes);

const notesRoutes = require("./routes/notes");
app.use("/api/notes", notesRoutes);

const generateQuizRoutes = require("./routes/ssgeneratequiz");
app.use("/api/quiz", generateQuizRoutes);

app.use("/api/rooms", require("./routes/studyRoomRoutes"));

// Database connection
require("./config/db");

// --- Socket.IO Logic ---
const activeRooms = {};
const userConnections = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", async ({ roomName, user }) => {
    try {
      if (!userConnections.has(user)) {
        userConnections.set(user, {
          socketIds: new Set(),
          currentRoom: null,
        });
      }

      const userData = userConnections.get(user);
      const isAlreadyInRoom = userData.currentRoom === roomName;

      if (userData.currentRoom && userData.currentRoom !== roomName) {
        socket.leave(userData.currentRoom);
        removeUserFromRoom(userData.currentRoom, user);
        notifyRoomUpdate(userData.currentRoom);
      }

      userData.socketIds.add(socket.id);
      userData.currentRoom = roomName;

      socket.join(roomName);

      if (!activeRooms[roomName]) {
        activeRooms[roomName] = new Set();
      }

      if (!isAlreadyInRoom) {
        activeRooms[roomName].add(user);
        socket.to(roomName).emit("userJoined", {
          user,
          users: Array.from(activeRooms[roomName]),
        });
      }

      io.to(roomName).emit("roomData", {
        users: Array.from(activeRooms[roomName]),
        count: activeRooms[roomName].size,
      });

      console.log(`${user} joined ${roomName}`);
    } catch (err) {
      console.error("Join room error:", err);
    }
  });

  socket.on("sendMessage", ({ roomName, user, message }) => {
    io.to(roomName).emit("receiveMessage", {
      user,
      message,
      timestamp: Date.now(),
    });
  });

  socket.on("sendFile", ({ roomName, user, file, fileName, fileType }) => {
    io.to(roomName).emit("receiveMessage", {
      user,
      message: "Sent a file",
      file,
      fileName,
      fileType,
      timestamp: Date.now(),
    });
  });

  socket.on("leaveRoom", async ({ roomName, user }) => {
    try {
      if (!userConnections.has(user)) return;

      socket.leave(roomName);
      const userData = userConnections.get(user);
      userData.socketIds.delete(socket.id);

      if (userData.socketIds.size === 0) {
        removeUserFromRoom(roomName, user);
        userConnections.delete(user);

        socket.to(roomName).emit("userLeft", {
          user,
          users: Array.from(activeRooms[roomName] || []),
        });
      }

      io.to(roomName).emit("roomData", {
        users: Array.from(activeRooms[roomName] || []),
        count: activeRooms[roomName]?.size || 0,
      });

      console.log(`${user} left ${roomName}`);
    } catch (err) {
      console.error("Leave room error:", err);
    }
  });

  socket.on("kickUser", async ({ roomName, adminId, userIdToKick }) => {
    try {
      const room = await Room.findOne({ name: roomName });

      if (!room || room.owner !== adminId) {
        return socket.emit("kickError", {
          error: "Only the room owner can kick users.",
        });
      }

      room.members = room.members.filter((member) => member !== userIdToKick);
      await room.save();

      if (activeRooms[roomName]) {
        activeRooms[roomName].delete(userIdToKick);
      }

      const kickedUserData = userConnections.get(userIdToKick);
      if (kickedUserData) {
        kickedUserData.socketIds.forEach((socketId) => {
          io.to(socketId).emit("youWereKicked", { roomName });
        });
        userConnections.delete(userIdToKick);
      }

      io.to(roomName).emit("userKicked", {
        userId: userIdToKick,
        users: Array.from(activeRooms[roomName] || []),
      });

      console.log(`${adminId} kicked ${userIdToKick} from ${roomName}`);
    } catch (err) {
      console.error("Kick user error:", err);
      socket.emit("kickError", { error: "Failed to kick user." });
    }
  });

  socket.on("endMeeting", async ({ roomName, adminId }) => {
    try {
      const room = await Room.findOne({ name: roomName });

      if (!room || room.owner !== adminId) {
        return socket.emit("endMeetingError", {
          error: "Only the room owner can end the meeting.",
        });
      }

      io.to(roomName).emit("meetingEnded", { roomName });

      if (activeRooms[roomName]) {
        activeRooms[roomName].forEach((user) => {
          const userData = userConnections.get(user);
          if (userData) {
            userData.socketIds.forEach((socketId) => {
              io.to(socketId).emit("youWereKicked", { roomName });
            });
            userConnections.delete(user);
          }
        });
        delete activeRooms[roomName];
      }

      await Room.deleteOne({ name: roomName });

      console.log(`${adminId} ended meeting in ${roomName}`);
    } catch (err) {
      console.error("End meeting error:", err);
      socket.emit("endMeetingError", { error: "Failed to end meeting." });
    }
  });

  socket.on("chatbotMessage", async ({ message }, callback) => {
    if (!genAI) {
      return callback({
        error: "Chatbot service is currently unavailable.",
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(message);
      const response = await result.response;
      const text = response.text();
      callback({ reply: text });
    } catch (error) {
      console.error("Gemini API error:", error);
      callback({ error: "Sorry, I couldn't process your request." });
    }
  });

  socket.on("disconnect", () => {
    for (const [user, userData] of userConnections.entries()) {
      if (userData.socketIds.has(socket.id)) {
        userData.socketIds.delete(socket.id);

        if (userData.socketIds.size === 0) {
          if (userData.currentRoom) {
            removeUserFromRoom(userData.currentRoom, user);

            io.to(userData.currentRoom).emit("userLeft", {
              user,
              users: Array.from(activeRooms[userData.currentRoom] || []),
            });

            io.to(userData.currentRoom).emit("roomData", {
              users: Array.from(activeRooms[userData.currentRoom] || []),
              count: activeRooms[userData.currentRoom]?.size || 0,
            });

            console.log(`${user} disconnected from ${userData.currentRoom}`);
          }
          userConnections.delete(user);
        }
        break;
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Helper functions
function removeUserFromRoom(roomName, user) {
  if (activeRooms[roomName]) {
    activeRooms[roomName].delete(user);
    if (activeRooms[roomName].size === 0) {
      delete activeRooms[roomName];
    }
  }
}

function notifyRoomUpdate(roomName) {
  if (activeRooms[roomName]) {
    io.to(roomName).emit("roomData", {
      users: Array.from(activeRooms[roomName]),
      count: activeRooms[roomName].size,
    });
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});