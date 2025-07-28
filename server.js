const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require("http");
const socketIo = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Room = require("./models/Room");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});






// Initialize Google Generative AI
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("GEMINI_API_KEY not found. Chatbot functionality will be disabled.");
}

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
const chatbotRoutes = require("./routes/chatbotRoutes");
app.use("/chatbot", chatbotRoutes);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Passport configuration
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

app.use("/api/profile", require("./routes/profileRoutes"));


app.use("/auth", require("./routes/authRoutes"));
app.use("/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/rooms", require("./routes/studyRoomRoutes"));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "Server is running!" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Socket.IO Logic
const activeRooms = {}; // { roomName: Set of users }
const userConnections = new Map(); // { username: { socketIds: Set, currentRoom: string } }

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", async ({ roomName, user }) => {
    try {


      if (!userConnections.has(user)) {
        userConnections.set(user, {
          socketIds: new Set(),
          currentRoom: null
        });
      }
      
      const userData = userConnections.get(user);

      // Check if the user is already in the room
      const isAlreadyInRoom = userData.currentRoom === roomName;

      // Leave previous room if different
      if (userData.currentRoom && userData.currentRoom !== roomName) {
        socket.leave(userData.currentRoom);
        removeUserFromRoom(userData.currentRoom, user);
        notifyRoomUpdate(userData.currentRoom);
      }

      // Track new socket for this user
      userData.socketIds.add(socket.id);
      userData.currentRoom = roomName;

      // Join new room
      socket.join(roomName);

      if (!activeRooms[roomName]) {
        activeRooms[roomName] = new Set();
      }

      // If user was not already in the room, send "userJoined" event
      if (!isAlreadyInRoom) {
        activeRooms[roomName].add(user);
        socket.to(roomName).emit("userJoined", {
          user,
          users: Array.from(activeRooms[roomName])
        });
      }

      // Send updated room data
      io.to(roomName).emit("roomData", {
        users: Array.from(activeRooms[roomName]),
        count: activeRooms[roomName].size
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
      timestamp: Date.now()
    });
  });

  socket.on("sendFile", ({ roomName, user, file, fileName, fileType }) => {
    io.to(roomName).emit("receiveMessage", {
      user,
      message: "Sent a file",
      file,
      fileName,
      fileType,
      timestamp: Date.now()
    });
  });

  socket.on("leaveRoom", async ({ roomName, user }) => {
    try {
      if (!userConnections.has(user)) return;

      socket.leave(roomName);
      const userData = userConnections.get(user);
      userData.socketIds.delete(socket.id);

      // Remove from room only if no more active sockets
      if (userData.socketIds.size === 0) {
        removeUserFromRoom(roomName, user);
        userConnections.delete(user);

        // Notify others only when the last socket disconnects
        socket.to(roomName).emit("userLeft", {
          user,
          users: Array.from(activeRooms[roomName] || [])
        });
      }

      // Update room data
      io.to(roomName).emit("roomData", {
        users: Array.from(activeRooms[roomName] || []),
        count: activeRooms[roomName]?.size || 0
      });

      console.log(`${user} left ${roomName}`);
    } catch (err) {
      console.error("Leave room error:", err);
    }
  });

  socket.on("kickUser", async ({ roomName, adminId, userIdToKick }) => {
    try {
      const room = await Room.findOne({ name: roomName });
      
      // Check if admin is owner
      if (!room || room.owner !== adminId) {
        socket.emit("kickError", { error: "Only the room owner can kick users." });
        return;
      }

      // Remove user from room members in database
      room.members = room.members.filter(member => member !== userIdToKick);
      await room.save();

      // Remove user from active room
      if (activeRooms[roomName]) {
        activeRooms[roomName].delete(userIdToKick);
      }

      // Notify the kicked user
      const kickedUserData = userConnections.get(userIdToKick);
      if (kickedUserData) {
        kickedUserData.socketIds.forEach(socketId => {
          io.to(socketId).emit("youWereKicked", { roomName });
        });
        userConnections.delete(userIdToKick);
      }

      // Notify the room
      io.to(roomName).emit("userKicked", { 
        userId: userIdToKick,
        users: Array.from(activeRooms[roomName] || [])
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
      
      // Check if admin is owner
      if (!room || room.owner !== adminId) {
        socket.emit("endMeetingError", { error: "Only the room owner can end the meeting." });
        return;
      }

      // Notify all users
      io.to(roomName).emit("meetingEnded", { roomName });

      // Remove all users from the room
      if (activeRooms[roomName]) {
        activeRooms[roomName].forEach(user => {
          const userData = userConnections.get(user);
          if (userData) {
            userData.socketIds.forEach(socketId => {
              io.to(socketId).emit("youWereKicked", { roomName });
            });
            userConnections.delete(user);
          }
        });
        delete activeRooms[roomName];
      }

      // Delete the room from database
      await Room.deleteOne({ name: roomName });

      console.log(`${adminId} ended meeting in ${roomName}`);
    } catch (err) {
      console.error("End meeting error:", err);
      socket.emit("endMeetingError", { error: "Failed to end meeting." });
    }
  });

  // Chatbot integration
  socket.on("chatbotMessage", async ({ message }, callback) => {
    if (!genAI) {
      return callback({
        error: "Chatbot service is currently unavailable."
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
    // Find which user disconnected
    for (const [user, userData] of userConnections.entries()) {
      if (userData.socketIds.has(socket.id)) {
        userData.socketIds.delete(socket.id);

        // If this was the last connection for the user
        if (userData.socketIds.size === 0) {
          if (userData.currentRoom) {
            removeUserFromRoom(userData.currentRoom, user);
            
            // Notify room about disconnection
            io.to(userData.currentRoom).emit("userLeft", { 
              user,
              users: Array.from(activeRooms[userData.currentRoom] || [])
            });

            io.to(userData.currentRoom).emit("roomData", {
              users: Array.from(activeRooms[userData.currentRoom] || []),
              count: activeRooms[userData.currentRoom]?.size || 0
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
      count: activeRooms[roomName].size
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