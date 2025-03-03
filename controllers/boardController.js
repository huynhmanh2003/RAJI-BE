const Board = require("../models/Board");

exports.getBoards = async (req, res) => {
  console.log(hehe);
  try {
    const boards = await Board.find().populate("lists");
    res.status(200).json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBoard = async (req, res) => {
  const { name, owner } = req.body;
  try {
    const board = new Board({ name, owner });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
