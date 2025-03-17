const { OK, CREATED } = require("../core/response/success.response");
const projectService = require("../services/project.service");
const { sendInviteEmail } = require("../services/email.service");
const User = require("../models/User"); // Import User model
const Project = require("../models/Project"); // Import Project model
const ProjectInvite = require("../models/ProjectInvite"); // Import ProjectInvite model

class ProjectController {
  createProject = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new CREATED({
      message: "Project created successfully",
      metadata: await projectService.createProject({
        userId,
        projectData: req.body,
      }),
    });
    result.send(res);
  };

  addBoardToProject = async (req, res, next) => {
    try {
      const projectId = req.params?.id;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!req.body.boardData) {
        return res.status(400).json({ error: "Board data is required" });
      }

      const updatedProject = await projectService.addBoardToProject({
        projectId,
        userId,
        boardData: req.body.boardData,
      });

      res.status(200).json({
        message: "Board added to project successfully",
        metadata: updatedProject,
      });
    } catch (error) {
      console.error("Error adding board to project:", error.message);
      res.status(500).json({ error: error.message });
    }
  };

  getAllProjects = async (req, res, next) => {
    const result = new OK({
      message: "Projects retrieved successfully",
      metadata: await projectService.getAllProjects(),
    });
    result.send(res);
  };

  getProjectById = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Project retrieved successfully",
      metadata: await projectService.getProjectById({
        projectId: req.params.id,
        userId,
      }),
    });
    result.send(res);
  };

  updateProject = async (req, res, next) => {
    const result = new OK({
      message: "Project updated successfully",
      metadata: await projectService.updateProject(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteProject = async (req, res, next) => {
    const result = new OK({
      message: "Project deleted successfully",
      metadata: await projectService.deleteProject(req.params.id),
    });
    result.send(res);
  };

  //  API gửi lời mời thành viên vào dự án qua email
  inviteMemberToProject = async (req, res, next) => {
    try {
      const { projectId, userEmail } = req.body;
      const userId = req.user?.userId; // Xác thực người gửi

      if (!userId) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
      }

      if (!projectId || !userEmail) {
        return res
          .status(400)
          .json({ message: "Project ID và Email là bắt buộc" });
      }

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng với email này" });
      }

      const existingInvite = await ProjectInvite.findOne({
        projectId,
        userId: user._id,
        status: "pending",
      });

      if (existingInvite) {
        return res.status(400).json({ message: "User đã được mời rồi" });
      }

      const invite = new ProjectInvite({ projectId, userId: user._id });
      await invite.save();

      // Gửi email lời mời
      await sendInviteEmail(userEmail, invite._id);

      res.status(200).json({ message: "Lời mời đã được gửi thành công" });
    } catch (error) {
      next(error);
    }
  };

  // ✅ API chấp nhận lời mời tham gia dự án
  acceptInvite = async (req, res, next) => {
    try {
      const { inviteId } = req.params;
      const invite = await ProjectInvite.findById(inviteId);

      if (!invite || invite.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Lời mời không hợp lệ hoặc đã hết hạn" });
      }

      const project = await Project.findById(invite.projectId);
      if (!project) {
        return res.status(404).json({ message: "Dự án không tồn tại" });
      }

      // Thêm user vào project
      project.members.push(invite.userId);
      await project.save();

      // Cập nhật trạng thái lời mời
      invite.status = "accepted";
      await invite.save();

      res
        .status(200)
        .json({ message: "Bạn đã tham gia dự án thành công!", project });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ProjectController();
