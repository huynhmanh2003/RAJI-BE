const express = require("express");
const router = express.Router();
const { authentication } = require("../auth/auth.middleware");
const asyncHandler = require("express-async-handler");
const taskController = require("../controllers/task.controller");
const commentRouter = require("./comment.router"); // Fixed import path

router.use(authentication); // Applied to all routes for consistency

router.get("/", asyncHandler(taskController.getAllTasks));
router.get("/:id", asyncHandler(taskController.getTask));
router.post("/", asyncHandler(taskController.createTask)); // Changed to createTask
router.patch("/:id", asyncHandler(taskController.updateTask));
router.delete("/:id", asyncHandler(taskController.deleteTask));

router.use("/:taskId/comments", commentRouter);

module.exports = router;