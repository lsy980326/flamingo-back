import db from "../../config/db";
import { Project, ProjectModel } from "../../models/project.model";
import { ProjectCollaboratorModel } from "../../models/projectCollaborator.model";
import { AppError } from "../../utils/AppError";
import logger from "../../config/logger";

class ProjectService {
  public async createProject(name: string, ownerId: number): Promise<Project> {
    const client = await db.getClient();
    try {
      // 프로젝트 생성과 협업자(소유자) 추가는 하나의 트랜잭션으로 처리
      await client.query("BEGIN");

      // 1. projects 테이블에 프로젝트 생성
      const newProject = await ProjectModel.create(name, ownerId, client);

      // 2. project_collaborators 테이블에 소유자 정보 추가
      await ProjectCollaboratorModel.add(
        newProject.id,
        ownerId,
        "owner",
        client
      );

      await client.query("COMMIT");
      return newProject;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Failed to create project in transaction", error);
      // AppError를 사용하여 구조화된 에러 반환
      throw error;
    } finally {
      client.release();
    }
  }

  public async getProjectsByUserId(userId: number): Promise<Project[]> {
    return ProjectModel.findByUserId(userId);
  }

  public async updateProject(
    projectId: string,
    name: string
  ): Promise<Project> {
    const updatedProject = await ProjectModel.update(projectId, name);
    if (!updatedProject) {
      throw new AppError("PROJECT_NOT_FOUND", 404);
    }
    return updatedProject;
  }

  public async deleteProject(projectId: string): Promise<void> {
    const deletedProject = await ProjectModel.softDelete(projectId);
    if (!deletedProject) {
      throw new AppError("PROJECT_NOT_FOUND", 404);
    }
  }
}

export default new ProjectService();
