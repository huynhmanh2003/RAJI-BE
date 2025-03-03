const mongoose = require("mongoose");
const Board = require("../models/board.model");
const { NotFoundError, BadRequestError } = require("../core/response/error.response");

class BoardService {
  static async createBoard(boardData) {  
    const { title, description, cover, memberIds, columnId } = boardData;
    if (!title) throw new BadRequestError("Board title is required");
    if (!columnId) throw new BadRequestError("Column ID is required");
    
    if (memberIds) {
      memberIds.forEach(id => {
        if (!mongoose.Types.ObjectId.isValid(id)) 
          throw new BadRequestError(`Invalid member ID: ${id}`);
      });
    }

    return await Board.create({ title, description, cover, memberIds, columnId });
  }

  static async getAllBoards() {
    return await Board.find()
      .populate("memberIds comments attachments")
      .lean();
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
    if (!data || !data.title) throw new BadRequestError("Board title is required");
    
    const board = await Board.findByIdAndUpdate(id, data, { new: true })
      .populate("memberIds comments attachments");
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