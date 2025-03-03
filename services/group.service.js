const mongoose = require("mongoose");
const Group = require("../models/group.model");
const {
  NotFoundError,
  BadRequestError,
} = require("../core/response/error.response");

class GroupService {
  static async createGroup({ userId, group }) {
    if (!group.name) throw new BadRequestError("Group name is required");
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new BadRequestError("Invalid user ID");
    return await Group.create({ ...group, owner: userId, members: [userId] });
  }

  static async getAllGroups() {
    return await Group.find().lean();
  }

  static async findGroup(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Group ID is required");

    const group = await Group.findById(id).populate("members").lean();
    if (!group) throw new NotFoundError("Group not found");
    return group;
  }

  static async updateGroup(id, data) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Group ID is required");
    if (!data || !data.name)
      throw new BadRequestError("Group name is required");

    const group = await Group.findByIdAndUpdate(id, data, { new: true });
    if (!group) throw new NotFoundError("Group not found");
    return group;
  }

  static async deleteGroup(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestError("Valid Group ID is required");

    const group = await Group.findByIdAndDelete(id);
    if (!group) throw new NotFoundError("Group not found");
    return group;
  }

  static async addMembers(groupId, userIds) {
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId))
      throw new BadRequestError("Valid Group ID is required");
    if (!Array.isArray(userIds) || userIds.length === 0)
      throw new BadRequestError("User IDs must be a non-empty array");

    userIds.forEach((id) => {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError(`Invalid user ID: ${id}`);
    });

    const group = await Group.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const newMembers = userIds.filter(
      (id) => !group.members.some((member) => member.equals(id))
    );

    if (newMembers.length === 0) return group;

    group.members.push(...newMembers);
    await group.save();

    return group;
  }
}

module.exports = GroupService;
