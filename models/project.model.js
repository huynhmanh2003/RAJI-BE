const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    projectMembers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    projectManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectBoards: [ // Thêm trường này
      { type: mongoose.Schema.Types.ObjectId, ref: "Board" }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);