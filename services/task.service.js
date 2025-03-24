const mongoose = require("mongoose");
const Task = require("../models/task.model");
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
    return await Task.create({ ...task, userId });
  }

  async getAllTasks() {
    return await Task.find().populate("assigneeId").lean();
  }

  async findTask(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid task ID");
    }
    const task = await Task.findById(id).populate("userId", "username");
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
    const task = await Task.findByIdAndUpdate(id, data, { new: true }).populate(
      "userId",
      "username"
    );
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }

 // Xóa task (chỉ PM mới có quyền)
  async deleteTask( taskId, userId ) {
  console.log("task_id:",taskId);
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  // // Kiểm tra quyền PM từ column mà task thuộc về
  // const column = await Column.findById(task.columnId);
  // if (!column) {
  //   throw new Error("Column not found");
  // }

  // const board = await Board.findById(column.boardId);
  // if (!board) {
  //   throw new Error("Board not found");
  // }

  // const project = await Project.findById(board.projectId);
  // if (!project || project.projectManagerId.toString() !== userId) {
  //   throw new Error("You are not authorized to delete this task");
  // }
  // // Xóa task khỏi danh sách tasks trong column
  // await Column.findByIdAndUpdate(column._id, { $pull: { tasks: taskId } });

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
    return task;
  }

}

module.exports = new TaskService();
