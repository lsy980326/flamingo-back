import db from "../config/db";

export type ProjectRole = "owner" | "editor" | "viewer";

export interface ProjectCollaborator {
  project_id: string;
  user_id: number;
  role: ProjectRole;
}

export class ProjectCollaboratorModel {
  // 프로젝트 생성 시, 소유자를 협업자 테이블에도 'owner'로 추가 (트랜잭션 내부에서 호출)
  static async add(
    projectId: string,
    userId: number,
    role: ProjectRole,
    client = db
  ): Promise<void> {
    const query = `
      INSERT INTO project_collaborators (project_id, user_id, role)
      VALUES ($1, $2, $3);
    `;
    await client.query(query, [projectId, userId, role]);
  }

  static async find(
    projectId: string,
    userId: number
  ): Promise<ProjectCollaborator | undefined> {
    const query =
      "SELECT * FROM project_collaborators WHERE project_id = $1 AND user_id = $2";
    const { rows } = await db.query(query, [projectId, userId]);
    return rows[0];
  }
}
