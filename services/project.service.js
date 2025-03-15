const Project = require("../models/project.model");
const User = require("../models/user.model");
const Invitation = require("../models/invitation.model");
const BoardService = require("./board.service");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const transporter = require("../config/email"); // Import transporter

class ProjectService {
  constructor(io, userSocketMap) {
    this.io = io;
    this.userSocketMap = userSocketMap;
  }

  async createProject({ userId, projectData }) {
    const { projectName, projectBoards } = projectData;

    if (!projectName) {
      throw new Error("projectName is required");
    }

    const newProject = new Project({
      projectName,
      projectMembers: [],
      projectManagerId: userId,
      projectBoards: projectBoards || [],
    });

    const savedProject = await newProject.save();
    await User.findByIdAndUpdate(
      userId,
      { $push: { project: savedProject._id } },
      { new: true }
    );

    const project = await Project.findById(savedProject._id)
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");

    const projectManagerId = project.projectManagerId._id.toString();
    const socketId = this.userSocketMap.get(projectManagerId);
    if (socketId) {
      this.io.to(socketId).emit("project:updated", {
        message: `Project ${project.projectName} has been created`,
        projectId: project._id.toString(),
        projectName: project.projectName,
      });
    }

    return project;
  }

  async addBoardToProject({ projectId, userId, boardData }) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }

    if (!boardData) {
      throw new Error("Board data is required");
    }

    const boardDataWithProjectId = { ...boardData, projectId };
    const board = await BoardService.createBoard(boardDataWithProjectId);
    if (!board || !board._id) {
      throw new Error("Failed to create board");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { projectBoards: board._id } },
      { new: true }
    ).populate("projectBoards projectMembers projectManagerId");

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    const isProjectManager = updatedProject.projectManagerId.toString() === userId;
    if (!isProjectManager) {
      throw new Error("You are not authorized to add board to project");
    }

    const memberIds = updatedProject.projectMembers.map(m => m._id.toString()) || [];
    const userIds = [...memberIds, updatedProject.projectManagerId._id.toString()];
    userIds.forEach((uid) => {
      const socketId = this.userSocketMap.get(uid);
      if (socketId) {
        this.io.to(socketId).emit("project:updated", {
          message: `Project ${updatedProject.projectName} has been updated: New board ${boardData.title || 'untitled'} added`,
          projectId: updatedProject._id.toString(),
          projectName: updatedProject.projectName,
        });
      }
    });

    return updatedProject;
  }

  async inviteMember({ projectId, userId, email }) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.projectManagerId.toString() !== userId) throw new Error("Only project manager can invite members");

    const token = jwt.sign({ projectId, email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const confirmationLink = `http://localhost:5000/api/projects/${projectId}/confirm-invite?token=${token}`;

    const invitation = new Invitation({
      projectId,
      userId,
      email,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Hết hạn sau 1 giờ
    });
    await invitation.save();

    // Sử dụng transporter.sendMail thay vì sendEmail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Invitation to Join Project",
      text: `Click this link to join the project: ${confirmationLink}`,
    };

    try {
      await transporter.sendMail(mailOptions); // Gọi trực tiếp sendMail
      console.log("Email sent successfully to:", email);
      return { email, projectId, invitationId: invitation._id };
    } catch (error) {
      console.error("Email sending error:", error);
      throw new Error("Failed to send invitation email: " + error.message);
    }
  }

  async confirmInvite(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { projectId, email } = decoded;

    const invitation = await Invitation.findOne({ token, email, projectId });
    if (!invitation) throw new Error("Invalid or expired invitation");
    if (invitation.status !== "pending") throw new Error("Invitation already processed");
    if (invitation.expiresAt < new Date()) throw new Error("Invitation has expired");

    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const userId = user._id.toString();
    const updatedProject = await this.addMembersToProject(projectId, [userId]);

    invitation.status = "accepted";
    await invitation.save();

    return { projectId, userId };
  }

  async addMembersToProject(projectId, memberIds) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }

    if (!memberIds || !Array.isArray(memberIds)) {
      throw new Error("memberIds must be an array");
    }

    memberIds.forEach((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid member ID: ${id}`);
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { projectMembers: { $each: memberIds } } },
      { new: true }
    ).populate("projectManagerId projectMembers projectBoards");

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    const memberIdsList = updatedProject.projectMembers.map(m => m._id.toString()) || [];
    const userIds = [...memberIdsList, updatedProject.projectManagerId._id.toString()];
    memberIds.forEach((uid) => {
      const socketId = this.userSocketMap.get(uid);
      if (socketId) {
        this.io.to(socketId).emit("member:added", {
          message: `You have been added to Project ${updatedProject.projectName}`,
          projectId: updatedProject._id.toString(),
          projectName: updatedProject.projectName,
        });
      }
    });

    userIds.forEach((uid) => {
      const socketId = this.userSocketMap.get(uid);
      if (socketId) {
        this.io.to(socketId).emit("project:updated", {
          message: `Project ${updatedProject.projectName} has been updated: New members added`,
          projectId: updatedProject._id.toString(),
          projectName: updatedProject.projectName,
        });
      }
    });

    return updatedProject;
  }

  async removeMembersFromProject(projectId, memberIds) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }

    if (!memberIds || !Array.isArray(memberIds)) {
      throw new Error("memberIds must be an array");
    }

    memberIds.forEach((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid member ID: ${id}`);
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $pull: { projectMembers: { $in: memberIds } } },
      { new: true }
    ).populate("projectManagerId projectMembers projectBoards");

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    const memberIdsList = updatedProject.projectMembers.map(m => m._id.toString()) || [];
    const userIds = [...memberIdsList, updatedProject.projectManagerId._id.toString()];
    userIds.forEach((uid) => {
      const socketId = this.userSocketMap.get(uid);
      if (socketId) {
        this.io.to(socketId).emit("project:updated", {
          message: `Project ${updatedProject.projectName} has been updated: Members removed`,
          projectId: updatedProject._id.toString(),
          projectName: updatedProject.projectName,
        });
      }
    });

    return updatedProject;
  }

  async updateProject(projectId, updates, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.projectManagerId.toString() !== userId) throw new Error("Only project manager can update project");

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updates },
      { new: true }
    )
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");

    const memberIds = updatedProject.projectMembers.map(m => m._id.toString()) || [];
    const userIds = [...memberIds, updatedProject.projectManagerId._id.toString()];
    userIds.forEach((uid) => {
      const socketId = this.userSocketMap.get(uid);
      if (socketId) {
        this.io.to(socketId).emit("project:updated", {
          message: `Project ${updatedProject.projectName} has been updated`,
          projectId: updatedProject._id.toString(),
          projectName: updatedProject.projectName,
        });
      }
    });

    return updatedProject;
  }

  async deleteProject(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.projectManagerId.toString() !== userId) throw new Error("Only project manager can delete project");

    await Project.findByIdAndDelete(projectId);

    const memberIds = project.projectMembers.map(m => m._id.toString()) || [];
    const userIds = [...memberIds, project.projectManagerId._id.toString()];
    userIds.forEach((uid) => {
      const socketId = this.userSocketMap.get(uid);
      if (socketId) {
        this.io.to(socketId).emit("project:updated", {
          message: `Project ${project.projectName} has been deleted`,
          projectId: project._id.toString(),
          projectName: project.projectName,
        });
      }
    });

    return { deletedProjectId: projectId };
  }

  async getAllProjects() {
    return await Project.find()
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");
  }

  async getProjectById({ projectId, userId }) {
    const project = await Project.findById(projectId)
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }
}

module.exports = (io, userSocketMap) => new ProjectService(io, userSocketMap);