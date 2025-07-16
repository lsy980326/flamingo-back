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

  //모든 협업자 목록 조회
  static async findAllByProjectId(projectId: string): Promise<any[]> {
    const query = `
      SELECT u.id, u.name, u.email, pc.role
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = $1
      ORDER BY
          CASE pc.role
              WHEN 'owner' THEN 1
              WHEN 'editor' THEN 2
              WHEN 'viewer' THEN 3
          END,
          u.name;
    `;
    const { rows } = await db.query(query, [projectId]);
    return rows;
  }

  static async updateRole(
    projectId: string,
    userId: number,
    newRole: ProjectRole
  ): Promise<void> {
    const query = `
      UPDATE project_collaborators
      SET role = $3
      WHERE project_id = $1 AND user_id = $2;
    `;
    await db.query(query, [projectId, userId, newRole]);
  }

  static async remove(projectId: string, userId: number): Promise<void> {
    const query = `
      DELETE FROM project_collaborators
      WHERE project_id = $1 AND user_id = $2;
    `;
    await db.query(query, [projectId, userId]);
  }
}
