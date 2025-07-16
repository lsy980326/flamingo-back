import db from "../../config/db";
import { Project, ProjectModel } from "../../models/project.model";
import { ProjectCollaboratorModel } from "../../models/projectCollaborator.model";
import { UserModel } from "../../models/user.model";
import { ProjectRole } from "../../models/projectCollaborator.model";
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

  public async addCollaborator(
    projectId: string,
    collaboratorEmail: string,
    role: ProjectRole
  ): Promise<void> {
    // 1. 초대할 사용자가 존재하는지 확인
    const userToAdd = await UserModel.findByEmail(collaboratorEmail);
    if (!userToAdd) {
      throw new AppError("USER_TO_ADD_NOT_FOUND", 404);
    }

    // 2. 이미 프로젝트에 참여 중인지 확인
    const existingCollaborator = await ProjectCollaboratorModel.find(
      projectId,
      userToAdd.id
    );
    if (existingCollaborator) {
      throw new AppError("USER_ALREADY_COLLABORATOR", 409); // 409 Conflict
    }

    // 3. 협업자 추가
    await ProjectCollaboratorModel.add(projectId, userToAdd.id, role);
  }

  public async getCollaborators(projectId: string): Promise<any[]> {
    return ProjectCollaboratorModel.findAllByProjectId(projectId);
  }

  public async updateCollaboratorRole(
    projectId: string,
    requesterId: number,
    targetUserId: number,
    newRole: ProjectRole
  ): Promise<void> {
    // 자기 자신의 역할은 변경할 수 없음 (소유자는 영원히 소유자)
    if (requesterId === targetUserId) {
      throw new AppError("CANNOT_CHANGE_OWN_ROLE", 400);
    }

    // 대상 유저가 협업자인지 확인
    const collaborator = await ProjectCollaboratorModel.find(
      projectId,
      targetUserId
    );
    if (!collaborator) {
      throw new AppError("COLLABORATOR_NOT_FOUND", 404);
    }

    // 소유자의 역할은 변경할 수 없음
    if (collaborator.role === "owner") {
      throw new AppError("CANNOT_CHANGE_OWNER_ROLE", 400);
    }

    await ProjectCollaboratorModel.updateRole(projectId, targetUserId, newRole);
    // TODO: 역할 변경 알림/이메일 발송 로직
  }

  public async removeCollaborator(
    projectId: string,
    requesterId: number,
    targetUserId: number
  ): Promise<void> {
    // 자기 자신(소유자)은 내보낼 수 없음
    if (requesterId === targetUserId) {
      throw new AppError("CANNOT_REMOVE_SELF", 400);
    }

    // 대상 유저가 협업자인지 확인
    const collaborator = await ProjectCollaboratorModel.find(
      projectId,
      targetUserId
    );
    if (!collaborator) {
      throw new AppError("COLLABORATOR_NOT_FOUND", 404);
    }

    await ProjectCollaboratorModel.remove(projectId, targetUserId);
  }
}

export default new ProjectService();
