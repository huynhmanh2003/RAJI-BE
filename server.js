require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./api/authRoutes");
const boardRoutes = require("./api/board.route");
const taskRoutes = require("./api/task.route");
const commentRoutes = require("./api/comment.route");
const projectRouter = require("./api/project.route");
const columnRouter = require("./api/column.route");
const http = require("http");
const socketIo = require("socket.io");
const createProjectService = require("./services/project.service");
const createProjectController = require("./controllers/project.controller");

const app = express();
connectDB();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"], // Thêm PUT, DELETE
}));
app.use(bodyParser.json());

// Tạo server HTTP và tích hợp Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Lưu mapping userId -> socketId
const userSocketMap = new Map();

// Khởi tạo service và controller với io, userSocketMap
const projectService = createProjectService(io, userSocketMap);
const projectController = createProjectController(io, userSocketMap);

// Gắn routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/projects", projectRouter(projectController)); // Truyền controller vào router
app.use("/api/columns", columnRouter);

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Xử lý kết nối Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("registerUser", (userId) => {
    console.log(`User ${userId} registered with socket ${socket.id}`);
    userSocketMap.set(userId.toString(), socket.id);
    console.log("Current userSocketMap:", [...userSocketMap.entries()]);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        console.log(`User ${userId} removed from mapping`);
        break;
      }
    }
    console.log("Current userSocketMap after disconnect:", [...userSocketMap.entries()]);
  });
});

// Lắng nghe server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));