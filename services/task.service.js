const mongoose = require("mongoose");
const Task = require("../models/task.model");
const {
  NotFoundError,
  UnprocessableEntityError,
  BadRequestError,
} = require("../core/response/error.response");
const commentModel = require("../models/comment.model");

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
    const task = await Task.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!task) throw new NotFoundError("Task not found");
    return task;
  }

  async deleteTask(taskId, userId) {
    console.log("task_id:", taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

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

    // Get the task before update to compare assignees later
    const beforeAssignedTask = await Task.findById(taskId);
    if (!beforeAssignedTask) throw new NotFoundError("Task not found");

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $push: { assigneeId: userId } },
      { new: true }
    ).populate("assigneeId");

    if (!task) throw new NotFoundError("Task not found");

    // Get old and new assignee IDs
    const oldAssigneeIds =
      beforeAssignedTask.assigneeId.map((assignee) =>
        assignee._id ? assignee._id.toString() : assignee.toString()
      ) || [];

    const newAssigneeIds = task.assigneeId.map((assignee) =>
      assignee._id ? assignee._id.toString() : assignee.toString()
    );

    const userIds = [
      ...new Set([...oldAssigneeIds, ...newAssigneeIds, userId]),
    ];

    const io = global._io;
    if (io && global._userSocketMap) {
      const timestamp = new Date().toISOString();

      userIds.forEach((recipientId) => {
        if (global._userSocketMap instanceof Map) {
          const socketId = global._userSocketMap.get(recipientId);

          if (socketId) {
            io.to(socketId).emit("task:assign", {
              message: `User has been assigned to task: ${task.title}`,
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: recipientId,
              taskId: taskId,
            });
          }
        } else {
          const socketId = global._userSocketMap[recipientId];
          if (socketId) {
            io.to(socketId).emit("task:assign", {
              message: `User has been assigned to task: ${task.title}`,
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: recipientId,
              taskId: taskId,
            });
          }
        }
      });
    } else {
      console.error(
        "Socket.io or userSocketMap is not initialized properly in assignTask"
      );
    }

    return task;
  }
  async unassignTask(userId, taskId) {
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestError("Invalid task ID, user ID, or project ID");
    }
    const beforeAssignedTask = await Task.findById(taskId);
    if (!beforeAssignedTask) throw new NotFoundError("Task not found");

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { assigneeId: userId } },
      { new: true }
    ).populate("assigneeId");
    const oldAssigneeIds =
      beforeAssignedTask.assigneeId.map((assignee) =>
        assignee._id.toString()
      ) || [];
    const newAssigneeIds = task.assigneeId.map((assignee) =>
      assignee._id.toString()
    );

    const userIds = [...oldAssigneeIds, ...newAssigneeIds];

    // Fix: Make sure we're accessing the global variables correctly
    const io = global._io;
    if (io && global._userSocketMap) {
      const timestamp = new Date().toISOString();

      userIds.forEach((recipientId) => {
        // Check if _userSocketMap is a Map and use get() method
        if (global._userSocketMap instanceof Map) {
          const socketId = global._userSocketMap.get(recipientId);

          if (socketId) {
            io.to(socketId).emit("task:unassign", {
              message: "Task unassigned, please check your tasks!",
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: recipientId,
            });
          }
        } else {
          const socketId = global._userSocketMap[recipientId];
          if (socketId) {
            io.to(socketId).emit("task:unassign", {
              message: "Task unassigned, please check your tasks!",
              type: "task",
              unread: true,
              timestamp: timestamp,
              userId: recipientId,
            });
          }
        }
      });
    } else {
      console.error("Socket.io or userSocketMap is not initialized properly");
    }

    if (!task) throw new NotFoundError("Task not found");
    return task;
  }
  async addCommentToTask(taskId, comment) {
    console.log("taskId", comment);

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new BadRequestError("Invalid task ID");
    }
    if (!comment.content) {
      throw new BadRequestError("Comment content is required");
    }

    const newComment = await commentModel.create(comment);
    const task = await Task.findById(taskId).populate("assigneeId");
    if (!task) throw new NotFoundError("Task not found");

    task.comments.push(newComment._id);
    await task.save();

    // Collect all users who should be notified (task creator and all assignees)
    const userIdsToNotify = new Set();

    // Add task creator
    if (task.userId && task.userId._id) {
      userIdsToNotify.add(task.userId._id.toString());
    } else if (task.userId) {
      userIdsToNotify.add(task.userId.toString());
    }

    // Add all assignees
    if (task.assigneeId && task.assigneeId.length > 0) {
      task.assigneeId.forEach((assignee) => {
        const assigneeId = assignee._id
          ? assignee._id.toString()
          : assignee.toString();
        userIdsToNotify.add(assigneeId);
      });
    }

    // Don't notify the comment creator

    // Access Socket.io and userSocketMap
    const io = global._io;
    if (io && global._userSocketMap) {
      const timestamp = new Date().toISOString();

      // Get commenter's name if available
      let commenterName = "Someone";
      if (comment.userId && comment.userName) {
        commenterName = comment.userName;
      }

      // Create a shortened version of the comment content for the notification
      const shortContent =
        comment.content.length > 30
          ? `${comment.content.substring(0, 30)}...`
          : comment.content;

      userIdsToNotify.forEach((recipientId) => {
        // Check if _userSocketMap is a Map and use get() method
        if (global._userSocketMap instanceof Map) {
          const socketId = global._userSocketMap.get(recipientId);
          if (socketId) {
            io.to(socketId).emit("task:comment", {
              message: `${commenterName} commented: "${shortContent}" on task "${task.title}"`,
              type: "comment",
              unread: true,
              timestamp: timestamp,
              userId: recipientId,
              taskId: taskId,
              commentId: newComment._id.toString(),
            });
          }
        } else {
          // Fallback if it's not a Map
          const socketId = global._userSocketMap[recipientId];
          if (socketId) {
            io.to(socketId).emit("task:comment", {
              message: `${commenterName} commented: "${shortContent}" on task "${task.title}"`,
              type: "comment",
              unread: true,
              timestamp: timestamp,
              userId: recipientId,
              taskId: taskId,
              commentId: newComment._id.toString(),
            });
          }
        }
      });
    } else {
      console.error(
        "Socket.io or userSocketMap is not initialized properly in addCommentToTask"
      );
    }

    return task;
  }
}

module.exports = new TaskService();
