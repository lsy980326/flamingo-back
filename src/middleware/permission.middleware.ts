import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import {
  ProjectCollaboratorModel,
  ProjectRole,
} from "../models/projectCollaborator.model";

// 허용된 최소 권한을 파라미터로 받는 고차 함수(미들웨어)
export const checkPermission = (requiredRole: ProjectRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id; // URL 파라미터에서 프로젝트 ID 추출

    if (!projectId) {
      return next(new AppError("PROJECT_ID_REQUIRED", 400));
    }

    const collaborator = await ProjectCollaboratorModel.find(projectId, userId);

    if (!collaborator) {
      // 프로젝트에 참여하고 있지 않은 사용자
      return next(new AppError("FORBIDDEN", 403));
    }

    // 권한 계층 정의: owner > editor > viewer
    const roleHierarchy: { [key in ProjectRole]: number } = {
      owner: 3,
      editor: 2,
      viewer: 1,
    };

    // 사용자의 권한이 요구되는 권한보다 높은지(숫자가 크거나 같은지) 확인
    if (roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole]) {
      // 권한이 충분하면 다음 미들웨어로 진행
      return next();
    } else {
      // 권한이 부족한 경우
      return next(new AppError("FORBIDDEN", 403));
    }
  };
};
