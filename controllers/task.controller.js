const { OK, CREATED } = require("../core/response/success.response");
const taskService = require("../services/task.service");

class TaskController {
  createTask = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");
    const result = new CREATED({
      message: "Task created successfully",
      metadata: await taskService.createTask({
        userId,
        task: req.body,
      }),
    });
    result.send(res);
  };

  getAllTasks = async (req, res, next) => {
    const result = new OK({
      message: "Tasks retrieved successfully",
      metadata: await taskService.getAllTasks(),
    });
    result.send(res);
  };

  getTask = async (req, res, next) => {
    const result = new OK({
      message: "Task retrieved successfully",
      metadata: await taskService.findTask(req.params.id),
    });
    result.send(res);
  };

  updateTask = async (req, res, next) => {
    const result = new OK({
      message: "Task updated successfully",
      metadata: await taskService.updateTask(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteTask = async (req, res, next) => {
    const result = new OK({
      message: "Task deleted successfully",
      metadata: await taskService.deleteTask(req.params.id),
    });
    result.send(res);
  };
  assignTask = async (req, res) => {
    try {
      const userId = req.user?.userId;
      const result = new OK({
        message: "Task assigned successfully",
        metadata: await taskService.assignTask(userId, req?.params?.id),
      });
      result.send(res);
    } catch (error) {
      res.status(400).send(error.message);
    }
  };
  unAssignTask = async (req, res) => {
    try {
      const userId = req.user?.userId;
      const result = new OK({
        message: "Task unassigned successfully",
        metadata: await taskService.unassignTask(userId, req.params?.id),
      });
      result.send(res);
    } catch (error) {
      res.status(400).send(error.message);
    }
  };
}
module.exports = new TaskController();
