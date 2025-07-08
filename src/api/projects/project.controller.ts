import { Request, Response, NextFunction } from "express";
import projectService from "./project.service";
import { toProjectResponseDto } from "./dtos/project.dto"; // DTO 변환 함수 import

class ProjectController {
  public async createProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { name } = req.body;
    const ownerId = req.user!.id;

    const newProject = await projectService.createProject(name, ownerId);

    res
      .status(201)
      .json({ success: true, data: toProjectResponseDto(newProject) });
  }

  public async getMyProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userId = req.user!.id;
    const projects = await projectService.getProjectsByUserId(userId);

    const projectDtos = projects.map(toProjectResponseDto);
    res.status(200).json({ success: true, data: projectDtos });
  }

  public async updateProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const projectId = req.params.id;
    const { name } = req.body;

    const updatedProject = await projectService.updateProject(projectId, name);
    res
      .status(200)
      .json({ success: true, data: toProjectResponseDto(updatedProject) });
  }

  public async deleteProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const projectId = req.params.id;
    await projectService.deleteProject(projectId);
    res
      .status(200)
      .json({
        success: true,
        message: "프로젝트가 성공적으로 삭제되었습니다.",
      });
  }
}

export default new ProjectController();
