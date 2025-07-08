import { Project } from "../../models/project.model";

// 클라이언트에게 보여줄 프로젝트 정보
export interface ProjectResponseDto {
  id: string;
  name: string;
  owner_id: number;
  created_at: Date;
}

// Entity를 DTO로 변환하는 함수
export function toProjectResponseDto(project: Project): ProjectResponseDto {
  return {
    id: project.id,
    name: project.name,
    owner_id: project.owner_id,
    created_at: project.created_at,
  };
}
