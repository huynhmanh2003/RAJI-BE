const { OK } = require("../core/response/success.response");
const groupService = require("../services/group.service");

class GroupController {
  createGroup = async (req, res, next) => {
    const userId = req.user.userId;
    const result = new OK({
      message: "Group created successfully",
      metadata: await groupService.createGroup({ userId, group: req.body }),
    });
    result.send(res);
  };

  getAllGroups = async (req, res, next) => {
    const result = new OK({
      message: "Groups retrieved successfully",
      metadata: await groupService.getAllGroups(),
    });
    result.send(res);
  };

  getGroup = async (req, res, next) => {
    const result = new OK({
      message: "Group retrieved successfully",
      metadata: await groupService.findGroup(req.params.id),
    });
    result.send(res);
  };

  updateGroup = async (req, res, next) => {
    const result = new OK({
      message: "Group updated successfully",
      metadata: await groupService.updateGroup(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteGroup = async (req, res, next) => {
    const result = new OK({
      message: "Group deleted successfully",
      metadata: await groupService.deleteGroup(req.params.id),
    });
    result.send(res);
  };

  addMembers = async (req, res, next) => {
    const result = new OK({
      message: "Members added successfully",
      metadata: await groupService.addMembers(req.params.id, req.body.userIds),
    });
    result.send(res);
  };
}

module.exports = new GroupController();