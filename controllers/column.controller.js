const { OK, CREATED } = require("../core/response/success.response");
const columnService = require("../services/column.service");

class ColumnController {
  createColumn = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new CREATED({
      message: "Column created successfully",
      metadata: await columnService.createColumn({
        columnData: req.body?.columnData,
      }),
    });
    result.send(res);
  };
  addTaskToColumn = async (req, res, next) => {
    const columnId = req.params?.id;
    const taskData = req.body?.taskData;
    const result = new OK({
      message: "Task added to column successfully",
      metadata: await columnService.addTaskToColumn({ columnId, taskData }),
    });
    result.send(res);
  };
  getAllColumns = async (req, res, next) => {
    const result = new OK({
      message: "Columns retrieved successfully",
      metadata: await columnService.getAllColumns(),
    });
    result.send(res);
  };

  getColumnById = async (req, res, next) => {
    const result = new OK({
      message: "Column retrieved successfully",
      metadata: await columnService.getColumnById(req.params.id),
    });
    result.send(res);
  };

  updateColumn = async (req, res, next) => {
    const result = new OK({
      message: "Column updated successfully",
      metadata: await columnService.updateColumn(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteColumn = async (req, res, next) => {
    const result = new OK({
      message: "Column deleted successfully",
      metadata: await columnService.deleteColumn(req.params.id),
    });
    result.send(res);
  };
}

module.exports = new ColumnController();
