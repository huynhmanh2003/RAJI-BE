const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    cover: { type: String, default: null },
    columnOrderIds: [{ type: String, required: false }],
    columnIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Column",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment", // Đảm bảo đây là đúng Model
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);
