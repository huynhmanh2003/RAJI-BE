const { OK, CREATED } = require("../core/response/success.response");
const projectService = require("../services/project.service");

class ProjectController {
  createProject = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new CREATED({
      message: "Project created successfully",
      metadata: await projectService.createProject({
        userId,
        projectData: req.body,
      }),
    });
    result.send(res);
  };

  addBoardToProject = async (req, res, next) => {
    try {
      // Lấy projectId từ URL
      const projectId = req.params?.id;
      // Lấy userId từ req.user (đã được xác thực trước đó)
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Kiểm tra dữ liệu board
      if (!req.body.boardData) {
        return res.status(400).json({ error: "Board data is required" });
      }

      // Thêm board vào project
      const updatedProject = await projectService.addBoardToProject({
        projectId,
        userId,
        boardData: req.body.boardData,
      });

      // Trả về kết quả
      res.status(200).json({
        message: "Board added to project successfully",
        metadata: updatedProject,
      });
    } catch (error) {
      console.error("Error adding board to project:", error.message);
      res.status(500).json({ error: error.message });
    }
  };

  getAllProjects = async (req, res, next) => {
    const result = new OK({
      message: "Projects retrieved successfully",
      metadata: await projectService.getAllProjects(),
    });
    result.send(res);
  };

  getProjectById = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) throw new Error("User not authenticated");

    const result = new OK({
      message: "Project retrieved successfully",
      metadata: await projectService.getProjectById({
        projectId: req.params.id,
        userId,
      }),
    });
    result.send(res);
  };

  updateProject = async (req, res, next) => {
    const result = new OK({
      message: "Project updated successfully",
      metadata: await projectService.updateProject(req.params.id, req.body),
    });
    result.send(res);
  };

  deleteProject = async (req, res, next) => {
    const result = new OK({
      message: "Project deleted successfully",
      metadata: await projectService.deleteProject(req.params.id),
    });
    result.send(res);
  };
}

module.exports = new ProjectController();
