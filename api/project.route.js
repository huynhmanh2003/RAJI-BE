const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Định nghĩa các route cho Project
router.post("/", authMiddleware, projectController.createProject); // Tạo project mới
router.get("/", projectController.getAllProjects); // Lấy danh sách tất cả project
router.get("/getproject", authMiddleware, projectController.getProjectByUserId);
router.get("/:id", authMiddleware, projectController.getProjectById); // Lấy thông tin một project theo ID
router.put("/:id", authMiddleware, projectController.updateProject); // Cập nhật project
router.delete("/:id", authMiddleware, projectController.deleteProject); // Xóa project
// create a board and add it to the project
router.put(
  "/:id/create-board",
  authMiddleware,
  projectController.addBoardToProject
);
router.post("/invite", authMiddleware, projectController.inviteMemberToProject);
router.get("/invite/:inviteId/accept", projectController.acceptInvite);
module.exports = router;
