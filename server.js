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

// Lắng nghe server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
