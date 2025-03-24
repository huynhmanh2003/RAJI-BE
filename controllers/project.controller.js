const { OK, CREATED } = require("../core/response/success.response");
const projectService = require("../services/project.service");
const { sendInviteEmail } = require("../services/email.service");
const User = require("../models/user.model"); // Import User model

const Project = require("../models/project.model"); // Import Project model
const ProjectInvite = require("../models/projectInvite.model"); // Import ProjectInvite model

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
    try {
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
    } catch (error) {
      res.status(405).send(error);
    }
  };

  updateProject = async (req, res, next) => {
    const result = new OK({
      message: "Project updated successfully",
      metadata: await projectService.updateProject(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteProject = async (req, res, next) => {
   // const boardId = req.board?.boardId;
    const userId = req.user?.userId;
    const result = new OK({
      message: "Project deleted successfully",
      metadata: await projectService.deleteProject(req.params.id,userId),
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
      console.log("userEmail received:", userEmail);
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
        return res.status(400).json({ message: "User Invitation Already" });
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

  //  API chấp nhận lời mời tham gia dự án
  acceptInvite = async (req, res, next) => {
    try {
      console.log("Accept Invite API called!");
      console.log("Invite ID:", req.params.inviteId);

      const { inviteId } = req.params;
      const invite = await ProjectInvite.findById(inviteId);

      if (!invite || invite.status !== "pending") {
        console.log("Invalid or expired invite");
        return res
          .status(400)
          .json({ message: "Lời mời không hợp lệ hoặc đã hết hạn" });
      }

      const project = await Project.findById(invite.projectId);
      const user = await User.findById(invite.userId);
      console.log("Project found:", project);

      if (!project) {
        console.log("Project not found");
        return res.status(404).json({ message: "Project not found" });
      }
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }

      // Kiểm tra xem projectMembers đã tồn tại chưa, nếu chưa thì khởi tạo
      if (!Array.isArray(project.projectMembers)) {
        console.log("projectMembers field is missing, initializing it.");
        project.projectMembers = [];
      }

      // Kiểm tra xem user đã có trong projectMembers chưa để tránh trùng lặp
      if (project.projectMembers.includes(invite.userId)) {
        console.log("User is already a member of the project.");
        return res
          .status(400)
          .json({ message: "Bạn đã là thành viên của dự án này" });
      }
      // Kiểm tra xem project đã có trong user's project chưa để tránh trùng lặp

      if (user.project.includes(invite.projectId)) {
        console.log("User is already a member of the project.");
        return res
          .status(400)
          .json({ message: "Bạn đã là thành viên của dự án này" });
      }
      // Thêm user vào projectMembers
      project.projectMembers.push(invite.userId);
      user.project.push(invite.projectId);
      await project.save();
      await user.save();

      // Cập nhật trạng thái lời mời
      invite.status = "accepted";
      await invite.save();

      console.log("User joined project successfully!");

      res
        .status(200)
        .json({ message: "Bạn đã tham gia dự án thành công!", project });
    } catch (error) {
      console.error("Error:", error);
      next(error);
    }
  };

  getProjectByUserId = async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      if (!userId) throw new Error("User not authenticated");
      const result = new OK({
        message: "Projects retrieved successfully",
        metadata: await projectService.getProjectByUserId(userId),
      });
      result.send(res);
    } catch (error) {
      res.status(405).send(error);
    }
  };
}
module.exports = new ProjectController();
