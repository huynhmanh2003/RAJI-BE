const { OK, CREATED } = require("../core/response/success.response");
const createProjectService = require("../services/project.service");

class ProjectController {
  constructor(io, userSocketMap) {
    this.projectService = createProjectService(io, userSocketMap);
  }

  createProject = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new CREATED({
      message: "Project created successfully",
      metadata: await this.projectService.createProject({
        userId,
        projectData: req.body,
      }),
    });
    result.send(res);
  };

  addBoardToProject = async (req, res, next) => {
    const projectId = req.params.id;
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Board added to project successfully",
      metadata: await this.projectService.addBoardToProject({
        projectId,
        userId,
        boardData: req.body.boardData,
      }),
    });
    result.send(res);
  };

  inviteMember = async (req, res, next) => {
    const projectId = req.params.id;
    const userId = req.user?.userId;
    const { email } = req.body;

    if (!userId) throw new Error("User not authenticated");
    if (!email) throw new Error("Email is required");

    const result = new OK({
      message: "Invitation email sent successfully",
      metadata: await this.projectService.inviteMember({ projectId, userId, email }),
    });
    result.send(res);
  };

  confirmInvite = async (req, res, next) => {
    const { token } = req.query;

    const result = new OK({
      message: "Invitation confirmed, you are now a member of the project",
      metadata: await this.projectService.confirmInvite(token),
    });
    result.send(res);
  };

  addMembersToProject = async (req, res, next) => {
    const projectId = req.params.id;
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Members added to project successfully",
      metadata: await this.projectService.addMembersToProject(projectId, req.body.memberIds),
    });
    result.send(res);
  };

  removeMembersFromProject = async (req, res, next) => {
    const projectId = req.params.id;
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Members removed from project successfully",
      metadata: await this.projectService.removeMembersFromProject(projectId, req.body.memberIds),
    });
    result.send(res);
  };

  updateProject = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Project updated successfully",
      metadata: await this.projectService.updateProject(req.params.id, req.body, userId),
    });
    result.send(res);
  };

  deleteProject = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Project deleted successfully",
      metadata: await this.projectService.deleteProject(req.params.id, userId),
    });
    result.send(res);
  };

  getAllProjects = async (req, res, next) => {
    const result = new OK({
      message: "Projects retrieved successfully",
      metadata: await this.projectService.getAllProjects(),
    });
    result.send(res);
  };

  getProjectById = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Project retrieved successfully",
      metadata: await this.projectService.getProjectById({
        projectId: req.params.id,
        userId,
      }),
    });
    result.send(res);
  };
}

module.exports = (io, userSocketMap) => new ProjectController(io, userSocketMap);