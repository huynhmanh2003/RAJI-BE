const mongoose = require("mongoose");
const Board = require("../models/board.model");
const ProjectService = require("./project.service");
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
      { $push: { columnOrderIds: savedColumn._id } }, // Sửa từ columnId thành columnOrderIds
      { new: true }
    ).populate("columnOrderIds");

    if (!updatedBoard) {
      await Column.findByIdAndDelete(savedColumn._id);
      throw new Error("Board not found");
    }

    // Gửi thông báo cho tất cả memberIds của Board
    const io = global._io; // Giả sử mày đã lưu io toàn cục
    const userSocketMap = global._userSocketMap;
    const memberIds = updatedBoard.memberIds || [];
    memberIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid.toString());
      if (socketId) {
        io.to(socketId).emit("board:updated", {
          message: `Board ${updatedBoard.title} has been updated: New column ${title} added`,
          boardId: updatedBoard._id.toString(),
          boardTitle: updatedBoard.title,
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

    // Thêm board vào projectBoards
    await ProjectService.addBoardToProject(projectId, board._id);

    // Gửi thông báo cho tất cả projectMembers
    const project = await ProjectService.findProject(projectId);
    const userIds = [
      ...project.projectMembers.map((member) => member._id.toString()),
      project.projectManagerId.toString(),
    ];
    const io = global._io;
    const userSocketMap = global._userSocketMap;
    userIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid);
      if (socketId) {
        io.to(socketId).emit("project:updated", {
          message: `Project ${project.projectName} has been updated: New board ${title} created`,
          projectId: project._id.toString(),
          projectName: project.projectName,
        });
        console.log(`Notified user ${uid} via socket ${socketId} about Project update`);
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

  static async findProject(projectId) { // Thêm hàm này để dùng trong createBoard
    const project = await Project.findById(projectId).populate("projectMembers projectManagerId");
    if (!project) throw new NotFoundError("Project not found");
    return project;
  }

  static async updateBoard(id, data) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");
    if (!data || !data.title)
      throw new BadRequestError("Board title is required");

    const boardBeforeUpdate = await Board.findById(id);
    if (!boardBeforeUpdate) throw new NotFoundError("Board not found");

    const board = await Board.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("memberIds columnOrderIds");
    if (!board) throw new NotFoundError("Board not found");

    // Gửi thông báo cho projectMembers nếu memberIds thay đổi
    const newMemberIds = data.memberIds || [];
    const existingMemberIds = boardBeforeUpdate.memberIds || [];
    const addedMemberIds = newMemberIds.filter(
      (newMember) => !existingMemberIds.some((existing) => existing.toString() === newMember.toString())
    );
    const project = await Project.findById(board.projectId).populate("projectMembers projectManagerId");
    const userIds = [
      ...project.projectMembers.map((member) => member._id.toString()),
      project.projectManagerId.toString(),
    ];

    if (addedMemberIds.length > 0) {
      const io = global._io;
      const userSocketMap = global._userSocketMap;
      userIds.forEach((uid) => {
        const socketId = userSocketMap.get(uid);
        if (socketId) {
          io.to(socketId).emit("project:updated", {
            message: `Project ${project.projectName} has been updated: Members changed in Board ${board.title}`,
            projectId: project._id.toString(),
            projectName: project.projectName,
          });
          console.log(`Notified user ${uid} via socket ${socketId} about Project update`);
        }
      });
    }

    return board;
  }

  static async deleteBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findById(id);
    if (!board) throw new NotFoundError("Board not found");

    await board.deleteOne();

    // Xóa board khỏi projectBoards
    await ProjectService.removeBoardFromProject(board.projectId, id);

    // Gửi thông báo cho projectMembers
    const project = await Project.findById(board.projectId).populate("projectMembers projectManagerId");
    const userIds = [
      ...project.projectMembers.map((member) => member._id.toString()),
      project.projectManagerId.toString(),
    ];
    const io = global._io;
    const userSocketMap = global._userSocketMap;
    userIds.forEach((uid) => {
      const socketId = userSocketMap.get(uid);
      if (socketId) {
        io.to(socketId).emit("project:updated", {
          message: `Project ${project.projectName} has been updated: Board ${board.title} deleted`,
          projectId: project._id.toString(),
          projectName: project.projectName,
        });
        console.log(`Notified user ${uid} via socket ${socketId} about Project update`);
      }
    });

    return board;
  }
}

module.exports = BoardService;