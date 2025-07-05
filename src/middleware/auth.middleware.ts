import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { UserModel } from "../models/user.model";

// Express의 Request 인터페이스에 user 속성을 추가하기 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: import("../models/user.model").User;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  // 1. 헤더에서 토큰 추출
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("UNAUTHORIZED", 401));
  }

  try {
    // 2. 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      iat: number;
      exp: number;
    };

    // 3. 토큰은 유효하지만, 그 사이에 사용자가 삭제되었을 수 있으므로 DB에서 사용자 확인
    const currentUser = await UserModel.findById(decoded.id); // findById 메소드 추가 필요

    if (!currentUser) {
      return next(new AppError("UNAUTHORIZED", 401));
    }

    // 4. 요청 객체에 사용자 정보 추가
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("TOKEN_EXPIRED", 401));
    }
    return next(new AppError("INVALID_TOKEN", 401));
  }
};
