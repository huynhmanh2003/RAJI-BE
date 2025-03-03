const { OK, CREATED } = require("../core/response/success.response");
const commentService = require("../services/comment.service");

class CommentController {
  createComment = async (req, res) => {
    const userId = req.user.userId;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const { taskId, content, parentCommentId } = req.body;
    const result = new CREATED({
      message: "Comment created successfully",
      metadata: await commentService.addComment({
        taskId,
        userId,
        content,
        parentCommentId: parentCommentId || null,
        imageUrl,
      }),
    });
    result.send(res);
  };

  getRootComments = async (req, res) => {
    const taskId = req.params.taskId;
    const result = new OK({
      message: "Root comments retrieved successfully",
      metadata: await commentService.getRootComments({ taskId }),
    });
    result.send(res);
  };

  getCommentReplies = async (req, res) => {
    const { commentId } = req.params;
    const result = new OK({
      message: "Comment replies retrieved successfully",
      metadata: await commentService.getCommentReplies({ commentId }),
    });
    result.send(res);
  };

  updateComment = async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const result = new OK({
      message: "Comment updated successfully",
      metadata: await commentService.updateComment({ commentId, content }),
    });
    result.send(res);
  };

  deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const result = new OK({
      message: "Comment deleted successfully",
      metadata: await commentService.deleteComment({ commentId }),
    });
    result.send(res);
  };
}

module.exports = new CommentController();
