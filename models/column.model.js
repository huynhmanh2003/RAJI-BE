const mongoose = require("mongoose");

const ColumnSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    cardOrderIds: { type: [String], required: false },
    tasks: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: false },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Column", ColumnSchema);
