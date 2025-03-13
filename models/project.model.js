const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true, // Tên dự án là bắt buộc
  },
  projectMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
  projectManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  projectBoards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: false,
    },
  ],
});

module.exports = mongoose.model("Project", ProjectSchema);
