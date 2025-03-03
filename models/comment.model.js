const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    left: {
      type: Number,
      required: true,
      index: true
    },
    right: {
      type: Number,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);