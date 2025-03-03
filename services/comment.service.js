const Comment = require("../models/comment.model");
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
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) throw new NotFoundError("Parent comment not found");
      if (parentComment.taskId.toString() !== taskId) {
        throw new BadRequestError(
          "Parent comment does not belong to this task"
        );
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
    } else {
      const maxRight = await Comment.findOne({ taskId }).sort({ right: -1 });
      rightValue = maxRight ? maxRight.right + 1 : 1;
    }

    return await Comment.create({
      taskId,
      userId,
      content,
      parentCommentId,
      imageUrl,
      left: rightValue,
      right: rightValue + 1,
    });
  }

  static async getRootComments({ taskId }) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new BadRequestError("Invalid taskId");
    }
    const comments = await Comment.find({ taskId, parentCommentId: null })
      .populate("userId", "username")
      .sort({ createdAt: 1 });

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
    return { deleted: true };
  }
}

module.exports = CommentService;
