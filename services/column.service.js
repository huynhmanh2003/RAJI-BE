const Column = require("../models/column.model");
const mongoose = require("mongoose");

class ColumnService {
  // Tạo column mới
  async createColumn({ columnData }) {
    const { title, cardOrderIds, cards } = columnData;

    if (!title) {
      throw new Error("Title is required");
    }

    const newColumn = new Column({
      title,
      cardOrderIds: cardOrderIds || [],
      cards: cards || [],
    });

    const savedColumn = await newColumn.save();

    return await Column.findById(savedColumn._id).populate("cards");
  }

  // Lấy tất cả column
  async getAllColumns() {
    return await Column.find().populate("cards");
  }

  // Lấy thông tin một column theo ID
  async getColumnById(columnId) {
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      throw new Error("Invalid column ID");
    }

    const column = await Column.findById(columnId).populate("cards");
    if (!column) {
      throw new Error("Column not found");
    }

    return column;
  }

  // Cập nhật column
  async updateColumn(columnId, updates) {
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      throw new Error("Invalid column ID");
    }

    const column = await Column.findById(columnId);
    if (!column) {
      throw new Error("Column not found");
    }

    const updatedColumn = await Column.findByIdAndUpdate(
      columnId,
      { $set: updates },
      { new: true }
    ).populate("cards");

    return updatedColumn;
  }

  // Xóa column
  async deleteColumn(columnId) {
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      throw new Error("Invalid column ID");
    }

    const column = await Column.findById(columnId);
    if (!column) {
      throw new Error("Column not found");
    }

    await Column.findByIdAndDelete(columnId);
    return { deletedColumnId: columnId };
  }
}

module.exports = new ColumnService();
