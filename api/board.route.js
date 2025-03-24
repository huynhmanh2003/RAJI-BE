const express = require("express");
const boardController = require("../controllers/board.controller");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", asyncHandler(boardController.getAllBoards));
router.post("/", authMiddleware, asyncHandler(boardController.createBoard)); // Fixed from newBoard to createBoard
router.get("/:id", asyncHandler(boardController.getBoard));
router.put("/updateboard/:id", asyncHandler(boardController.updateBoardData));

router.put("/:id", asyncHandler(boardController.updateBoard));
router.delete("/:id", asyncHandler(boardController.deleteBoard));
router.put(
  "/:id/create-column",
  authMiddleware,
  boardController.addColumnToBoard
);
module.exports = router;
