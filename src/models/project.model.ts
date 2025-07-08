import db from "../config/db";

export interface Project {
  id: string;
  name: string;
  owner_id: number;
  deleted_at: Date | null;
  created_at: Date; // 이 필드 추가
}

export class ProjectModel {
  // 프로젝트 생성
  static async create(
    name: string,
    ownerId: number,
    client = db
  ): Promise<Project> {
    const query = `
      INSERT INTO projects (name, owner_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await client.query(query, [name, ownerId]);
    return rows[0];
  }

  // 내가 소유하거나 협업자로 참여한 프로젝트 목록 조회
  static async findByUserId(userId: number): Promise<Project[]> {
    const query = `
      SELECT p.* FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE (p.owner_id = $1 OR pc.user_id = $1)
      AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  static async update(
    projectId: string,
    name: string
  ): Promise<Project | undefined> {
    const query = `
        UPDATE projects
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *;
    `;
    const { rows } = await db.query(query, [name, projectId]);
    return rows[0];
  }

  static async softDelete(projectId: string): Promise<Project | undefined> {
    const query = `
        UPDATE projects
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *;
    `;
    const { rows } = await db.query(query, [projectId]);
    return rows[0];
  }
}
