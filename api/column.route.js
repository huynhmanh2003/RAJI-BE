const express = require("express");
const router = express.Router();
const columnController = require("../controllers/column.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware, columnController.createColumn);
router.get("/", authMiddleware, columnController.getAllColumns);
router.get("/:id", authMiddleware, columnController.getColumnById);
router.put("/:id", authMiddleware, columnController.updateColumn);
router.delete("/:id", authMiddleware, columnController.deleteColumn);

router.put(
  "/:id/create-task",
  authMiddleware,
  columnController.addTaskToColumn
);

module.exports = router;
