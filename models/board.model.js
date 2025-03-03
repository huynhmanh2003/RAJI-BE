const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    cover: { type: String, default: null },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    attachments: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    columnId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);
