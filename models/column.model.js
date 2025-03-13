const mongoose = require("mongoose");

const ColumnSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    cardOrderIds: { type: [String], required: false },
    cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Column", ColumnSchema);
