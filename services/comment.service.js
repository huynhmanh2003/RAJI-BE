const Comment = require("../models/comment.model");
const Task = require("../models/task.model");
const Column = require("../models/column.model");
const Board = require("../models/board.model");
const User = require("../models/user.model");
const {
  NotFoundError,
  BadRequestError,
} = require("../core/response/error.response");
const mongoose = require("mongoose");

class CommentService {
  static async addComment({
    taskId,
    userId,
    content,
    parentCommentId = null,
    imageUrl = null,
  }) {
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestError("Invalid taskId or userId");
    }
    if (!content) throw new BadRequestError("Comment content is required");

    let rightValue;
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        throw new BadRequestError("Invalid parentCommentId");
      }
      const parentComment = await Comment.findById(parentCommentId).populate("userId", "username");
      if (!parentComment) throw new NotFoundError("Parent comment not found");
      if (parentComment.taskId.toString() !== taskId) {
        throw new BadRequestError("Parent comment does not belong to this task");
      }
      rightValue = parentComment.right;
      await Comment.updateMany(
        { taskId, right: { $gte: rightValue } },
        { $inc: { right: 2 } }
      );
      await Comment.updateMany(
        { taskId, left: { $gt: rightValue } },
        { $inc: { left: 2 } }
      );

      const task = await Task.findById(taskId).populate("assigneeId", "username");
      if (!task) {
      } else {
        const column = await Column.findOne({ tasks: taskId }).populate("tasks");
        if (!column) {
        } else {
          const board = await Board.findOne({ columnOrderIds: column._id }).populate("projectId");
          if (!board) {
          } else {
            const project = await board.projectId;
            const memberIds = (board.memberIds || []).map((member) => member._id.toString());
            const assigneeIds = (task.assigneeId || []).map((user) => user._id.toString());
            
            const replyUser = await User.findById(userId).select("username");
            const replyUserName = replyUser ? replyUser.username || `User ${userId}` : `User ${userId}`;
            
            if (parentComment.userId.toString() === userId.toString()) {
            } else {
              const userIds = [...new Set([parentComment.userId.toString(), ...memberIds, ...assigneeIds, project.projectManagerId.toString()])];
              const io = global._io;
              const userSocketMap = global._userSocketMap;
              const timestamp = new Date().toISOString();
              userIds.forEach((uid) => {
                const socketId = userSocketMap.get(uid);
                if (socketId) {
                  io.to(socketId).emit("notification", {
                    message: `${replyUserName} đã phản hồi bình luận của bạn trên nhiệm vụ "${task.title}" trong cột "${column.title}".`,
                    type: "comment",
                    unread: true,
                    timestamp: timestamp,
                    userId: uid,
                  });
                }
              });
            }
          }
        }
      }
    } else {
      const maxRight = await Comment.findOne({ taskId }).sort({ right: -1 });
      rightValue = maxRight ? maxRight.right + 1 : 1;
    }

    const newComment = await Comment.create({
      taskId,
      userId,
      content,
      parentCommentId,
      imageUrl,
      left: rightValue,
      right: rightValue + 1,
    });

    return newComment;
  }

  static async getRootComments({ taskId }) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new BadRequestError("Invalid taskId");
    }
    const comments = await Comment.find({ taskId, parentCommentId: null })
      .populate("userId", "username")
      .sort({ createdAt: 1});

    comments.forEach((comment) => {
      comment.hasReplies = comment.right - comment.left > 1;
      comment.replies = [];
    });

    return comments;
  }

  static async getCommentReplies({ commentId }) {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new BadRequestError("Invalid commentId");
    }
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) throw new NotFoundError("Comment not found");

    const replies = await Comment.find({
      taskId: parentComment.taskId,
      parentCommentId: commentId,
    })
      .populate("userId", "username")
      .sort({ createdAt: 1 })
      .lean();

    replies.forEach((reply) => {
      reply.hasReplies = reply.right - reply.left > 1;
      reply.replies = [];
    });

    return replies;
  }

  static async updateComment({ commentId, content }) {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new BadRequestError("Invalid commentId");
    }
    if (!content) throw new BadRequestError("Comment content is required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");

    comment.content = content;
    comment.updatedAt = new Date();
    await comment.save();

    return comment;
  }

  static async deleteComment({ commentId }) {
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new BadRequestError("Invalid commentId");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");

    const width = comment.right - comment.left + 1;
    await Comment.deleteMany({
      taskId: comment.taskId,
      left: { $gte: comment.left },
      right: { $lte: comment.right },
    });
    await Comment.updateMany(
      { taskId: comment.taskId, right: { $gt: comment.right } },
      { $inc: { right: -width } }
    );
    await Comment.updateMany(
      { taskId: comment.taskId, left: { $gt: comment.right } },
      { $inc: { left: -width } }
    );

    const task = await Task.findById(comment.taskId).populate("assigneeId", "username");
    if (task) {
      const column = await Column.findOne({ tasks: comment.taskId }).populate("tasks");
      if (column) {
        const board = await Board.findOne({ columnOrderIds: column._id }).populate("projectId");
        if (board) {
          const project = await board.projectId;
          const memberIds = (board.memberIds || []).map((member) => member._id.toString());
          const assigneeIds = (task.assigneeId || []).map((user) => user._id.toString());
          const userIds = [...new Set([comment.userId.toString(), ...memberIds, ...assigneeIds, project.projectManagerId.toString()])];
          const io = global._io;
          const userSocketMap = global._userSocketMap;
          const timestamp = new Date().toISOString();
          userIds.forEach((uid) => {
            const socketId = userSocketMap.get(uid);
            if (socketId) {
              io.to(socketId).emit("notification", {
                message: `Bình luận trên nhiệm vụ "${task.title}" trong cột "${column.title}" đã bị xóa.`,
                type: "comment",
                unread: true,
                timestamp: timestamp,
                userId: uid,
              });
            }
          });
        }
      }
    }

    return { deleted: true };
  }
}

module.exports = CommentService;
