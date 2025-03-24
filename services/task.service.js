const mongoose = require("mongoose");
const Task = require("../models/task.model");
const Column = require("../models/column.model");
const Board = require("../models/board.model");
const {
  NotFoundError,
  UnprocessableEntityError,
  BadRequestError,
} = require("../core/response/error.response");
const projectService = require("./project.service");

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
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }

 // Xóa task (chỉ PM mới có quyền)
 static async deleteTask({ taskId, userId }) {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  // Kiểm tra quyền PM từ column mà task thuộc về
  const column = await Column.findById(task.columnId);
  if (!column) {
    throw new Error("Column not found");
  }

  const board = await Board.findById(column.boardId);
  if (!board) {
    throw new Error("Board not found");
  }

  const project = await Project.findById(board.projectId);
  if (!project || project.projectManagerId.toString() !== userId) {
    throw new Error("You are not authorized to delete this task");
  }
  // Xóa task khỏi danh sách tasks trong column
  await Column.findByIdAndUpdate(column._id, { $pull: { tasks: taskId } });

  // Xóa task
  await Task.findByIdAndDelete(taskId);

  return { deletedTaskId: taskId };
}

  async assignTask(userId, taskId) {
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestError("Invalid task ID, user ID, or project ID");
    }
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $push: { assigneeId: userId } },
      { new: true }
    ).populate("assigneeId");
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }
  async unassignTask(userId, taskId) {
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestError("Invalid task ID, user ID, or project ID");
    }
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { assigneeId: userId } },
      { new: true }
    ).populate("assigneeId");
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