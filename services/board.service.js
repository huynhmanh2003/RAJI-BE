const mongoose = require("mongoose");
const Board = require("../models/board.model");
const ProjectService = require("./project.service");
const Project = require("../models/project.model");
const {
  NotFoundError,
  BadRequestError,
} = require("../core/response/error.response");
const Column = require("../models/column.model");
const Project = require("../models/project.model");
const columnService = require("./column.service");

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
      {
        $push: { columnIds: savedColumn._id, columnOrderIds: savedColumn._id },
      },
      { new: true }
    ).populate("columnIds");

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
    return await Board.find().lean(); // Bỏ populate
  }

  static async findBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findById(id)
      .populate({
        path: "columnIds",
        populate: "tasks",
      })
      .lean();

    if (!board) throw new NotFoundError("Board not found");
    board.columnIds = board.columnIds.map((column) => ({
      ...column,
      tasksOrderIds: column.tasksOrderIds.flat(),
    }));
    return board;
  }
  static async updateBoardData(id, boardData) {
    const data = boardData.boardData;

    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Invalid Board ID");
    if (!data) throw new BadRequestError("Board data is required");
    const columnOrderIds = data.map((column) => {
      columnService.updateColumn(column._id, {
        ...column,
        tasks: column.tasksOrderIds,
        tasksOrderIds: column.tasksOrderIds,
      });
      return column._id;
    });

    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      {
        columnOrderIds: columnOrderIds,
        columnIds: columnOrderIds,
      },
      { new: true }
    ).populate("columnIds");
    if (!updatedBoard) throw new NotFoundError("Board not found");
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

  static async deleteBoard({ boardId, userId }) {
    const board = await Board.findById(boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Kiểm tra quyền PM từ project mà board thuộc về
    const project = await Project.findById(board.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.projectManagerId.toString() !== userId) {
      throw new Error("You are not authorized to delete this board");
    }

    // Xóa tất cả columns trong board
    for (const columnId of board.columnOrderIds) {
      await ColumnService.deleteColumn({ columnId, userId });
    }

    // Xóa board khỏi danh sách projectBoards trong project
    await Project.findByIdAndUpdate(project._id, {
      $pull: { projectBoards: boardId },
    });

    // Xóa board
    await Board.findByIdAndDelete(boardId);

    return { deletedBoardId: boardId };
  }
}

module.exports = BoardService;