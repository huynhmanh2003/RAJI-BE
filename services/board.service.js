const mongoose = require("mongoose");
const Board = require("../models/board.model");
const {
  NotFoundError,
  BadRequestError,
} = require("../core/response/error.response");
const Column = require("../models/column.model");
const Project = require("../models/project.model");
const columnService = require("./column.service");

class BoardService {
  static async createColumnAndAddToBoard({ boardId, columnData }) {
    // Kiểm tra boardId hợp lệ

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new Error("Invalid board ID");
    }

    const { title, cardOrderIds, tasks } = columnData;
    if (!title) {
      throw new Error("Title is required");
    }

    // Tạo column mới
    const newColumn = new Column({
      title,
      cardOrderIds: cardOrderIds || [],
      tasks: tasks || [],
    });

    const savedColumn = await newColumn.save();

    // Tìm và cập nhật board
    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      {
        $push: { columnIds: savedColumn._id, columnOrderIds: savedColumn._id },
      },
      { new: true }
    ).populate("columnIds");

    if (!updatedBoard) {
      // Nếu board không tồn tại, xóa column vừa tạo để tránh dữ liệu rác
      await Column.findByIdAndDelete(savedColumn._id);
      throw new Error("Board not found");
    }

    return await Column.findById(savedColumn._id);
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
    return await Board.find().lean(); // Bỏ populate
  }

  static async findBoard(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Board ID is required");

    const board = await Board.findById(id)
      .populate({
        path: "columnIds",
        populate: {
          path: "tasks",
          populate: [
            {
              path: "comments",
              populate: {
                path: "userId",
                select: "username", // Select only the fields you need
              },
            },
            {
              path: "assigneeId",
              select: "username", // Select only the fields you need
            },
          ],
        },
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
    if (!data || !data.title)
      throw new BadRequestError("Board title is required");

    const board = await Board.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("memberIds comments attachments");
    if (!board) throw new NotFoundError("Board not found");
    return board;
  }

  static async deleteBoard(boardId, userId) {
    console.log("boardId:", boardId);
    const board = await Board.findById(boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Kiểm tra quyền PM từ project mà board thuộc về
    // const project = await Project.findById(board.projectId);
    // if (!project) {
    //   throw new Error("Project not found");
    // }

    // if (project.projectManagerId.toString() !== userId) {
    //   throw new Error("You are not authorized to delete this board");
    // }

    // // Xóa tất cả columns trong board
    // for (const columnId of board.columnOrderIds) {
    //   await ColumnService.deleteColumn({ columnId, userId });
    // }

    // // Xóa board khỏi danh sách projectBoards trong project
    // await Project.findByIdAndUpdate(project._id, {
    //   $pull: { projectBoards: boardId },
    // });

    // Xóa board
    await Board.findByIdAndDelete(boardId);

    return { deletedBoardId: boardId };
  }
}

module.exports = BoardService;
