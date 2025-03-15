const mongoose = require("mongoose");
const Board = require("../models/board.model");
const ProjectService = require("./project.service");
const Project = require("../models/project.model");
const {
  NotFoundError,
  BadRequestError,
} = require("../core/response/error.response");
const Column = require("../models/column.model");

class BoardService {
  static async createColumnAndAddToBoard({ boardId, columnData }) {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new Error("Invalid board ID");
    }

    const { title, cardOrderIds, tasks } = columnData;
    if (!title) {
      throw new Error("Title is required");
    }

    const newColumn = new Column({
      title,
      cardOrderIds: cardOrderIds || [],
      tasks: tasks || [],
    });

    const savedColumn = await newColumn.save();
    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      { $push: { columnOrderIds: savedColumn._id } },
      { new: true }
    ).populate("columnOrderIds memberIds");

    if (!updatedBoard) {
      await Column.findByIdAndDelete(savedColumn._id);
      throw new Error("Board not found");
    }

    const project = await Project.findById(updatedBoard.projectId).populate("projectManagerId");
    const memberIds = (updatedBoard.memberIds || []).map((member) => member._id.toString());
    const userIds = [...new Set([...memberIds, project.projectManagerId.toString()])];
    const io = global._io;
    const userSocketMap = global._userSocketMap;
    const timestamp = new Date().toISOString();
    userIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid);
      if (socketId) {
        io.to(socketId).emit("notification", {
          message: `Cột "${title}" đã được thêm vào bảng "${updatedBoard.title}" trong dự án "${project.projectName}".`,
          type: "board",
          unread: true,
          timestamp: timestamp,
          userId: uid,
        });
        console.log(`Notified user ${uid} via socket ${socketId} about Board update`);
      }
    });

    return await Column.findById(savedColumn._id);
  }

  static async createBoard(boardData) {
    const { title, description, cover, memberIds, projectId } = boardData;
    if (!title) throw new BadRequestError("Board title is required");
    if (!projectId) throw new BadRequestError("Project ID is required");

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError(`Invalid project ID: ${projectId}`);
    }

    if (memberIds) {
      memberIds.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id))
          throw new BadRequestError(`Invalid member ID: ${id}`);
      });
    }

    const board = await Board.create({
      title,
      description,
      cover,
      memberIds,
      projectId,
    });

    try {
      await ProjectService.addBoardToProjectSimple(projectId, board._id);
    } catch (error) {
      await Board.findByIdAndDelete(board._id);
      throw new BadRequestError(`Failed to add board to project: ${error.message}`);
    }

    const project = await Project.findById(projectId).populate("projectManagerId");
    const userIds = [
      ...(memberIds || []).map((id) => id.toString()),
      project.projectManagerId.toString(),
    ];
    const io = global._io;
    const userSocketMap = global._userSocketMap;
    const timestamp = new Date().toISOString();
    userIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid);
      if (socketId) {
        io.to(socketId).emit("notification", {
          message: `Bảng "${title}" đã được tạo trong dự án "${project.projectName}".`,
          type: "board",
          unread: true,
          timestamp: timestamp,
          userId: uid,
        });
      }
    });

    return board;
  }

  static async getAllBoards() {
    return await Board.find().populate("memberIds columnOrderIds").lean();
  }

  static async findBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findById(id)
      .populate("memberIds columnOrderIds")
      .lean();
    if (!board) throw new NotFoundError("Board not found");
    return board;
  }

  static async findProject(projectId) {
    const project = await Project.findById(projectId).populate("projectMembers projectManagerId");
    if (!project) throw new NotFoundError("Project not found");
    return project;
  }

  static async updateBoard(id, data) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const boardBeforeUpdate = await Board.findById(id).populate("memberIds");
    if (!boardBeforeUpdate) throw new NotFoundError("Board not found");

    if (data.title && !data.title.trim()) {
      throw new BadRequestError("Board title cannot be empty");
    }

    const board = await Board.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("memberIds columnOrderIds");
    if (!board) throw new NotFoundError("Board not found");

    const project = await Project.findById(board.projectId).populate("projectManagerId");
    const oldMemberIds = (boardBeforeUpdate.memberIds || []).map((member) => member._id.toString());
    const newMemberIds = (data.memberIds || board.memberIds || []).map((id) => id.toString());
    const userIds = [
      ...new Set([...oldMemberIds, ...newMemberIds, project.projectManagerId.toString()]),
    ];

    const io = global._io;
    const userSocketMap = global._userSocketMap;
    const timestamp = new Date().toISOString();
    userIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid);
      if (socketId) {
        io.to(socketId).emit("notification", {
          message: `Bảng "${board.title}" trong dự án "${project.projectName}" đã được cập nhật.`,
          type: "board",
          unread: true,
          timestamp: timestamp,
          userId: uid,
        });
      }
    });

    return board;
  }

  static async deleteBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findById(id).populate("memberIds");
    if (!board) throw new NotFoundError("Board not found");

    await board.deleteOne();
    await ProjectService.removeBoardFromProject(board.projectId, id);

    const project = await Project.findById(board.projectId).populate("projectManagerId");
    const memberIds = (board.memberIds || []).map((member) => member._id.toString());
    const userIds = [...new Set([...memberIds, project.projectManagerId.toString()])];
    const io = global._io;
    const userSocketMap = global._userSocketMap;
    const timestamp = new Date().toISOString();
    userIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid);
      if (socketId) {
        io.to(socketId).emit("notification", {
          message: `Bảng "${board.title}" trong dự án "${project.projectName}" đã bị xóa.`,
          type: "board",
          unread: true,
          timestamp: timestamp,
          userId: uid,
        });
      }
    });

    return board;
  }
}

module.exports = BoardService;