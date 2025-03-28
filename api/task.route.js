const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const taskController = require("../controllers/task.controller");
const commentRouter = require("./comment.route");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.get("/", asyncHandler(taskController.getAllTasks));
router.get("/:id", asyncHandler(taskController.getTask));
router.post("/", asyncHandler(taskController.createTask));
router.patch("/:id", asyncHandler(taskController.updateTask));
router.delete("/:id", asyncHandler(taskController.deleteTask));
router.put("/:id/assign-task", asyncHandler(taskController.assignTask));
router.put("/:id/unassign-task", asyncHandler(taskController.unAssignTask));
router.put(
  "/:id/create-comment",
  asyncHandler(taskController.addCommentToTask)
);
// router.use("/:taskId/comments", commentRouter);

module.exports = router;
