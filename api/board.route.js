const express = require("express");
const boardController = require("../controllers/board.controller");
const router = express.Router();
const { authentication } = require("../auth/auth.middleware");
const asyncHandler = require("express-async-handler");

router.use(authentication);

router.get("/", asyncHandler(boardController.getAllBoards));
router.post("/", asyncHandler(boardController.createBoard)); // Fixed from newBoard to createBoard
router.get("/:id", asyncHandler(boardController.getBoard));
router.put("/:id", asyncHandler(boardController.updateBoard));
router.delete("/:id", asyncHandler(boardController.deleteBoard));

module.exports = router;
