const mongoose = require("mongoose");

const DOCUMENT_NAME = "Task";
const COLLECTION_NAME = "tasks";

const taskSchema = new mongoose.Schema(
  {
    assigneeId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    title: {
      type: String,
      required: true,
      trim: true, // Added trimming
    },
    description: {
      type: String,
      required: true,
      trim: true, // Added trimming
    },
    cover: { type: String, default: null },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    attachments: {
      type: [String],
      required: false,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = mongoose.model(DOCUMENT_NAME, taskSchema);
