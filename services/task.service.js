const mongoose = require("mongoose");
const Task = require("../models/task.model");
const Column = require("../models/column.model");
const Board = require("../models/board.model");
const {
  NotFoundError,
  UnprocessableEntityError,
  BadRequestError,
} = require("../core/response/error.response");

class TaskService {
  async createTask({ userId, task }) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid userId");
    }
    if (!task.title || !task.description) {
      throw new BadRequestError("Title and description are required");
    }

    const existingTask = await Task.findOne({ title: task.title, userId });
    if (existingTask) {
      throw new UnprocessableEntityError(
        "Task with the same title already exists"
      );
    }

    const newTask = await Task.create({ ...task, userId });
    const taskPopulated = await Task.findById(newTask._id).populate("assigneeId", "username");

    // Gửi thông báo
    const column = await Column.findOne({ tasks: newTask._id }).populate("tasks");
    if (column) {
      const board = await Board.findOne({ columnOrderIds: column._id }).populate("projectId");
      if (board) {
        const project = await board.projectId;
        const memberIds = (board.memberIds || []).map((member) => member._id.toString());
        const assigneeIds = (taskPopulated.assigneeId || []).map((user) => user._id.toString());
        const userIds = [...new Set([...memberIds, ...assigneeIds, project.projectManagerId.toString()])];
        const io = global._io;
        const userSocketMap = global._userSocketMap;
        const timestamp = new Date().toISOString();
        userIds.forEach((uid) => {
          const socketId = userSocketMap.get(uid);
          if (socketId) {
            io.to(socketId).emit("notification", {
              message: `Nhiệm vụ "${task.title}" đã được tạo trong cột "${column.title}" thuộc bảng "${board.title}".`,
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: uid,
            });
          }
        });
      }
    }

    return taskPopulated;
  }

  async getAllTasks() {
    return await Task.find().populate("assigneeId", "username").lean();
  }

  async findTask(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid task ID");
    }
    const task = await Task.findById(id).populate("assigneeId", "username");
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }

  async updateTask(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid task ID");
    }
    if (data.title === "" || data.description === "") {
      throw new BadRequestError("Title and description cannot be empty");
    }

    const taskBeforeUpdate = await Task.findById(id).populate("assigneeId");
    if (!taskBeforeUpdate) throw new NotFoundError("Task not found");

    const updatedTask = await Task.findByIdAndUpdate(id, data, { new: true }).populate(
      "assigneeId",
      "username"
    );
    if (!updatedTask) throw new NotFoundError("Task not found");

    // Gửi thông báo
    const column = await Column.findOne({ tasks: id }).populate("tasks");
    if (column) {
      const board = await Board.findOne({ columnOrderIds: column._id }).populate("projectId");
      if (board) {
        const project = await board.projectId;
        const memberIds = (board.memberIds || []).map((member) => member._id.toString());
        const oldAssigneeIds = (taskBeforeUpdate.assigneeId || []).map((user) => user._id.toString());
        const newAssigneeIds = (data.assigneeId || []).map((id) => id.toString());
        const userIds = [...new Set([...memberIds, ...oldAssigneeIds, ...newAssigneeIds, project.projectManagerId.toString()])];
        const io = global._io;
        const userSocketMap = global._userSocketMap;
        const timestamp = new Date().toISOString();
        userIds.forEach((uid) => {
          const socketId = userSocketMap.get(uid);
          if (socketId) {
            io.to(socketId).emit("notification", {
              message: `Nhiệm vụ "${updatedTask.title}" trong cột "${column.title}" đã được cập nhật.`,
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: uid,
            });
          }
        });
      }
    }

    return updatedTask;
  }

  async deleteTask(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid task ID");
    }

    const task = await Task.findById(id).populate("assigneeId");
    if (!task) throw new NotFoundError("Task not found");

    await Task.findByIdAndDelete(id);

    // Gửi thông báo
    const column = await Column.findOne({ tasks: id }).populate("tasks");
    if (column) {
      const board = await Board.findOne({ columnOrderIds: column._id }).populate("projectId");
      if (board) {
        const project = await board.projectId;
        const memberIds = (board.memberIds || []).map((member) => member._id.toString());
        const assigneeIds = (task.assigneeId || []).map((user) => user._id.toString());
        const userIds = [...new Set([...memberIds, ...assigneeIds, project.projectManagerId.toString()])];
        const io = global._io;
        const userSocketMap = global._userSocketMap;
        const timestamp = new Date().toISOString();
        userIds.forEach((uid) => {
          const socketId = userSocketMap.get(uid);
          if (socketId) {
            io.to(socketId).emit("notification", {
              message: `Nhiệm vụ "${task.title}" trong cột "${column.title}" đã bị xóa.`,
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: uid,
            });
          }
        });
      }
    }

    return task;
  }
}

module.exports = new TaskService();