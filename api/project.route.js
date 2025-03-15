
const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware, projectController.createProject); // Tạo project mới
router.get("/", projectController.getAllProjects); // Lấy danh sách tất cả project
router.get("/getproject", authMiddleware, projectController.getProjectByUserId);
router.get("/:id", authMiddleware, projectController.getProjectById); // Lấy thông tin một project theo ID
router.put("/:id", authMiddleware, projectController.updateProject); // Cập nhật project
router.delete("/:id", authMiddleware, projectController.deleteProject); // Xóa project
router.put(
  "/:id/create-board",
  authMiddleware,
  projectController.addBoardToProject
);
module.exports = router;
