const mongoose = require("mongoose");
const Board = require("../models/board.model");
const {
  NotFoundError,
  BadRequestError,
} = require("../core/response/error.response");
const Column = require("../models/column.model");

class BoardService {
  static async createColumnAndAddToBoard({ boardId, columnData, userId }) {
    // Kiểm tra boardId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new Error("Invalid board ID");
    }

    const { title, cardOrderIds, cards } = columnData;
    if (!title) {
      throw new Error("Title is required");
    }

    // Tạo column mới
    const newColumn = new Column({
      title,
      cardOrderIds: cardOrderIds || [],
      cards: cards || [],
    });

    const savedColumn = await newColumn.save();

    // Tìm và cập nhật board
    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      { $push: { columns: savedColumn._id } },
      { new: true }
    ).populate("columns");

    if (!updatedBoard) {
      // Nếu board không tồn tại, xóa column vừa tạo để tránh dữ liệu rác
      await Column.findByIdAndDelete(savedColumn._id);
      throw new Error("Board not found");
    }

    // Kiểm tra quyền (giả sử chỉ project manager của project chứa board được phép thêm column)
    const project = await Project.findById(updatedBoard.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const isProjectManager = project.projectManagerId.toString() === userId;
    if (!isProjectManager) {
      // Xóa column vừa tạo nếu không có quyền
      await Column.findByIdAndDelete(savedColumn._id);
      throw new Error("You are not authorized to add column to this board");
    }

    return await Column.findById(savedColumn._id).populate("cards");
  }
  static async createBoard(boardData) {
    const { title, description, cover, memberIds } = boardData;
    if (!title) throw new BadRequestError("Board title is required");

    if (memberIds) {
      memberIds.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id))
          throw new BadRequestError(`Invalid member ID: ${id}`);
      });
    }

    return await Board.create({
      title,
      description,
      cover,
      memberIds,
    });
  }

  static async getAllBoards() {
    return await Board.find().populate("memberIds comments attachments").lean();
  }

  static async findBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findById(id)
      .populate("memberIds comments attachments")
      .lean();
    if (!board) throw new NotFoundError("Board not found");
    return board;
  }

  static async updateBoard(id, data) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");
    if (!data || !data.title)
      throw new BadRequestError("Board title is required");

    const board = await Board.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("memberIds comments attachments");
    if (!board) throw new NotFoundError("Board not found");
    return board;
  }

  static async deleteBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findByIdAndDelete(id);
    if (!board) throw new NotFoundError("Board not found");
    return board;
  }
}

module.exports = BoardService;
