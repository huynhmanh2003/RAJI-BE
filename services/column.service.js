const Column = require("../models/column.model");
const mongoose = require("mongoose");
const Task = require("../models/task.model");

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
      tasks: tasks || [],
    });

    const savedColumn = await newColumn.save();

    return await Column.findById(savedColumn._id).populate("tasks");
  }
  async addTaskToColumn({ columnId, taskData }) {
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      throw new Error("Invalid column ID");
    }
    const newTask = new Task(taskData);
    const saveTask = await newTask.save();
    const column = await Column.findByIdAndUpdate(
      columnId,
      { $push: { tasks: saveTask._id } },
      { new: true }
    ).populate("tasks");
    if (!column) {
      await Task.findByIdAndDelete(saveTask._id);
      throw new Error("Column not found");
    }
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
    ).populate("tasks");

    return updatedColumn;
  }

  // Xóa column (chỉ PM mới có quyền)
  static async deleteColumn({ columnId, boardId, pmId, userId }) {
    const column = await Column.findById(columnId);
    if (!column) {
      throw new Error("Column not found");
    }

    // Kiểm tra column có thuộc board này không
    if (column.boardId.toString() !== boardId) {
      throw new Error("Invalid boardId for this column");
    }

    // Lấy thông tin board và project để xác minh quyền PM
    const board = await Board.findById(boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const project = await Project.findById(board.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Kiểm tra quyền: PM của project phải khớp với userId
    if (pmId !== userId || project.projectManagerId.toString() !== userId) {
      throw new Error("You are not authorized to delete this column");
    }

    // Xóa tất cả tasks trong column
    for (const taskId of column.tasks) {
      await TaskService.deleteTask({ taskId, userId });
    }

    // Xóa column khỏi danh sách columns trong board
    await Board.findByIdAndUpdate(boardId, {
      $pull: { columnOrderIds: columnId },
    });

    // Xóa column
    await Column.findByIdAndDelete(columnId);

    return { deletedColumnId: columnId };
  }
}

module.exports = new ColumnService();
