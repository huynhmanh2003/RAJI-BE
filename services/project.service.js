const Project = require("../models/project.model");
const User = require("../models/user.model");
const BoardService = require("./board.service");
const mongoose = require("mongoose");

class ProjectService {
  // Tạo project mới
  async createProject({ userId, projectData }) {
    const { projectName, projectMembers, projectBoards } = projectData;

    if (!projectName) {
      throw new Error("projectName is required");
    }

    const newProject = new Project({
      projectName,
      projectMembers: projectMembers || [],
      projectManagerId: userId,
      projectBoards: projectBoards || [],
    });

    const savedProject = await newProject.save();
    await User.findByIdAndUpdate(
      userId,
      { $push: { project: savedProject._id } },
      { new: true }
    );

    return await Project.findById(savedProject._id)
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");
  }

  // Thêm board vào project (phiên bản đầy đủ, giữ nguyên)
  async addBoardToProject({ projectId, userId, boardData }) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }

    if (!boardData) {
      throw new Error("Board data is required");
    }

    const board = await BoardService.createBoard(boardData);
    if (!board || !board._id) {
      throw new Error("Failed to create board");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { projectBoards: board._id } },
      { new: true }
    ).populate("projectBoards");

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    const isProjectManager = updatedProject.projectManagerId.toString() === userId;
    if (!isProjectManager) {
      throw new Error("You are not authorized to add board to project");
    }

    return updatedProject;
  }

  // Thêm board vào project (phiên bản đơn giản, chỉ thêm boardId)
  async addBoardToProjectSimple(projectId, boardId) {
    console.log("Adding board to project. Project ID:", projectId, "Board ID:", boardId); // Log để debug
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new Error("Invalid board ID");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { projectBoards: boardId } },
      { new: true }
    ).populate("projectBoards");

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    return updatedProject;
  }

  // Xóa board khỏi project (được gọi từ board.service.js)
  async removeBoardFromProject(projectId, boardId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new Error("Invalid board ID");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $pull: { projectBoards: boardId } },
      { new: true }
    ).populate("projectBoards");

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    return updatedProject;
  }

  // Lấy danh sách tất cả project
  async getAllProjects() {
    return await Project.find()
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");
  }

  // Lấy thông tin một project theo ID
  async getProjectById({ projectId, userId }) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId ID");
    }
    const project = await Project.findById(projectId).populate({
      path: "projectBoards",
      select: "_id title",
    });
    if (!project) {
      throw new Error("Project not found");
    }

    const isProjectManager = project.projectManagerId.toString() === userId;
    const isProjectMember = project.projectMembers.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isProjectManager && !isProjectMember) {
      throw new Error("You are not authorized to access this project");
    }

    return project;
  }

  // Cập nhật project
  async updateProject(projectId, updates) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updates },
      { new: true }
    )
      .populate("projectManagerId", "username email")
      .populate("projectMembers", "username email")
      .populate("projectBoards");

    return updatedProject;
  }

  // Xóa project
  async deleteProject(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await Project.findByIdAndDelete(projectId);
    return { deletedProjectId: projectId };
  }

  async getProjectByUserId(userId) {
    const projects = await Project.find({ projectManagerId: userId });
    if (!projects) {
      throw new Error("No projects found for this user");
    }
    return projects;
  }
}

module.exports = new ProjectService();