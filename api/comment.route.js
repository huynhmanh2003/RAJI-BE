const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const commentController = require("../controllers/comment.controller");
const multer = require("multer");
const authMiddleware = require("../middleware/auth.middleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.use(authMiddleware);

router.post(
  "/",
  upload.single("image"),
  asyncHandler(commentController.createComment)
); // Single endpoint for all comments
router.get("/:taskId", asyncHandler(commentController.getRootComments));
router.get(
  "/:commentId/replies",
  asyncHandler(commentController.getCommentReplies)
);
router.patch("/:commentId", asyncHandler(commentController.updateComment));
router.delete("/:commentId", asyncHandler(commentController.deleteComment));

module.exports = router;
