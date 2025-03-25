require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./api/authRoutes");
const boardRoutes = require("./api/board.route");
const taskRoutes = require("./api/task.route");
const commentRoutes = require("./api/comment.route");
const projectRouter = require("./api/project.route");
const columnRouter = require("./api/column.route");

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/projects", projectRouter);
app.use("/api/columns", columnRouter);
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
global._io = io;
global._userSocketMap = new Map();
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  const userId = socket.handshake.query.userId || socket.handshake.auth.userId; // Lấy từ query hoặc auth
  if (userId) {
    global._userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
    console.log("Current userSocketMap:", [...global._userSocketMap]);
  }

  // Xử lý event register từ FE
  socket.on("register", (userId) => {
    if (userId) {
      global._userSocketMap.set(userId, socket.id);
      console.log(
        `User ${userId} registered with socket ${socket.id} via register event`
      );
      console.log("Current userSocketMap:", [...global._userSocketMap]);
    }
  });

  socket.on("disconnect", () => {
    for (let [uid, socketId] of global._userSocketMap.entries()) {
      if (socketId === socket.id) {
        global._userSocketMap.delete(uid);
        console.log(`User ${uid} disconnected`);
        break;
      }
    }
  });
});

// Lắng nghe server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
