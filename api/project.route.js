const express = require("express");
const asyncHandler = require("express-async-handler");
const authMiddleware = require("../middleware/auth.middleware");

module.exports = (projectController) => {
  const router = express.Router();

  router.get("/", asyncHandler(projectController.getAllProjects));
  router.post("/", authMiddleware, asyncHandler(projectController.createProject));
  router.get("/:id", asyncHandler(projectController.getProjectById));
  router.put("/:id", authMiddleware, asyncHandler(projectController.updateProject));
  router.delete("/:id", authMiddleware, asyncHandler(projectController.deleteProject));
  router.post("/:id/add-board", authMiddleware, asyncHandler(projectController.addBoardToProject));
  router.post("/:id/add-members", authMiddleware, asyncHandler(projectController.addMembersToProject));
  router.post("/:id/remove-members", authMiddleware, asyncHandler(projectController.removeMembersFromProject));
  router.post("/:id/invite-member", authMiddleware, asyncHandler(projectController.inviteMember));
  router.get("/:id/confirm-invite", asyncHandler(projectController.confirmInvite));

  return router;
};