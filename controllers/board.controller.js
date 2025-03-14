const { OK } = require("../core/response/success.response");
const boardService = require("../services/board.service");

class BoardController {
  createBoard = async (req, res, next) => {
    const userId = req.user?.userId;
    const boardData = { ...req.body, creator: userId };

    const result = new OK({
      message: "Board created successfully",
      metadata: await boardService.createBoard(boardData),
    });
    result.send(res);
  };
  addColumnToBoard = async (req, res, next) => {
    const boardId = req.params?.id;
    const columnData = req.body.columnData;
    console.log(boardId);

    const result = new OK({
      message: "Column added to board successfully",
      metadata: await boardService.createColumnAndAddToBoard({
        boardId,
        columnData,
      }),
    });
    result.send(res);
  };
  getAllBoards = async (req, res, next) => {
    const result = new OK({
      message: "Boards retrieved successfully",
      metadata: await boardService.getAllBoards(),
    });
    result.send(res);
  };

  getBoard = async (req, res, next) => {
    const result = new OK({
      message: "Board retrieved successfully",
      metadata: await boardService.findBoard(req.params.id),
    });
    result.send(res);
  };

  updateBoard = async (req, res, next) => {
    const result = new OK({
      message: "Board updated successfully",
      metadata: await boardService.updateBoard(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteBoard = async (req, res, next) => {
    const result = new OK({
      message: "Board deleted successfully",
      metadata: await boardService.deleteBoard(req.params.id),
    });
    result.send(res);
  };
}

module.exports = new BoardController();
