const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Định nghĩa các route cho Project
router.post("/", authMiddleware, projectController.createProject);
router.get("/", projectController.getAllProjects);
router.get("/getproject", authMiddleware, projectController.getProjectByUserId);
router.get("/:id", authMiddleware, projectController.getProjectById);
router.put("/:id", authMiddleware, projectController.updateProject);
router.delete("/:id", authMiddleware, projectController.deleteProject);
router.put(
  "/:id/create-board",
  authMiddleware,
  projectController.addBoardToProject
);
router.post("/invite", authMiddleware, projectController.inviteMemberToProject);
router.get("/invite/:inviteId/accept", projectController.acceptInvite);
module.exports = router;
