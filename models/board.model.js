const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    cover: { type: String, default: null },
    columnOrderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Column",
      },
    ],
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    projectId: { // Thêm trường này
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);
