const mongoose = require("mongoose");
const Task = require("../models/task.model");
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
    return await Task.create({ ...task, userId });
  }

  async getAllTasks() {
    return await Task.find().populate("userId", "username").lean();
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

  async deleteTask(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid task ID");
    }
    const task = await Task.findByIdAndDelete(id);
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }
}

module.exports = new TaskService();
