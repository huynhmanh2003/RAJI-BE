const Column = require("../models/column.model");
const mongoose = require("mongoose");
const Task = require("../models/task.model");
const Board = require("../models/board.model");

class ColumnService {
  // Tạo column mới
  async createColumn({ columnData }) {
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
    const column = await Column.findById(savedColumn._id).populate("tasks");

    // Gửi thông báo
    const board = await Board.findOne({ columnOrderIds: column._id }).populate("projectId");
    if (board) {
      const project = await board.projectId;
      const userIds = (board.memberIds || []).map((member) => member.toString()).concat(board.projectId.projectManagerId.toString());
      const io = global._io;
      const userSocketMap = global._userSocketMap;
      const timestamp = new Date().toISOString();
      userIds.forEach((uid) => {
        const socketId = userSocketMap.get(uid);
        if (socketId) {
          io.to(socketId).emit("notification", {
            message: `Cột "${title}" đã được tạo trong bảng "${board.title}" thuộc dự án "${project.projectName}".`,
            type: "column",
            unread: true,
            timestamp: timestamp,
            userId: uid,
          });
        }
      });
    }

    return column;
  }

  async addTaskToColumn({ columnId, taskData }) {
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      throw new Error("Invalid column ID");
    }
    const newTask = new Task(taskData);
    const savedTask = await newTask.save();
    const column = await Column.findByIdAndUpdate(
      columnId,
      { $push: { tasks: savedTask._id } },
      { new: true }
    ).populate("tasks");
    if (!column) {
      await Task.findByIdAndDelete(savedTask._id);
      throw new Error("Column not found");
    }

    // Gửi thông báo
    const board = await Board.findOne({ columnOrderIds: columnId }).populate("projectId");
    if (board) {
      const project = await board.projectId;
      const userIds = (board.memberIds || []).map((member) => member.toString()).concat(board.projectId.projectManagerId.toString());
      const io = global._io;
      const userSocketMap = global._userSocketMap;
      const timestamp = new Date().toISOString();
      userIds.forEach((uid) => {
        const socketId = userSocketMap.get(uid);
        if (socketId) {
          io.to(socketId).emit("notification", {
            message: `Nhiệm vụ "${taskData.title || 'New Task'}" đã được thêm vào cột "${column.title}" trong bảng "${board.title}".`,
            type: "task",
            unread: true,
            timestamp: timestamp,
            userId: uid,
          });
        }
      });
    }

    return column;
  }

  // Lấy tất cả column
  async getAllColumns() {
    return await Column.find().populate("tasks");
  }

  // Lấy thông tin một column theo ID
  async getColumnById(columnId) {
    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      throw new Error("Invalid column ID");
    }

    const column = await Column.findById(columnId).populate("tasks");
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

    // Gửi thông báo
    const board = await Board.findOne({ columnOrderIds: columnId }).populate("projectId");
    if (board) {
      const project = await board.projectId;
      const userIds = (board.memberIds || []).map((member) => member.toString()).concat(board.projectId.projectManagerId.toString());
      const io = global._io;
      const userSocketMap = global._userSocketMap;
      const timestamp = new Date().toISOString();
      userIds.forEach((uid) => {
        const socketId = userSocketMap.get(uid);
        if (socketId) {
          io.to(socketId).emit("notification", {
            message: `Cột "${updates.title || column.title}" trong bảng "${board.title}" đã được cập nhật.`,
            type: "column",
            unread: true,
            timestamp: timestamp,
            userId: uid,
          });
        }
      });
    }

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

    // Gửi thông báo
    const board = await Board.findOne({ columnOrderIds: columnId }).populate("projectId");
    if (board) {
      const project = await board.projectId;
      const userIds = (board.memberIds || []).map((member) => member.toString()).concat(board.projectId.projectManagerId.toString());
      const io = global._io;
      const userSocketMap = global._userSocketMap;
      const timestamp = new Date().toISOString();
      userIds.forEach((uid) => {
        const socketId = userSocketMap.get(uid);
        if (socketId) {
          io.to(socketId).emit("notification", {
            message: `Cột "${column.title}" trong bảng "${board.title}" đã bị xóa.`,
            type: "column",
            unread: true,
            timestamp: timestamp,
            userId: uid,
          });
        }
      });
    }

    return { deletedColumnId: columnId };
  }
}

module.exports = new ColumnService();