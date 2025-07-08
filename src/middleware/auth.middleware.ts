// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { UserModel, User as CustomUser } from "../models/user.model";

// 전역 타입 확장
declare global {
  namespace Express {
    interface User extends CustomUser {} // Passport가 사용하는 User와 우리 User를 병합
    interface Request {
      user?: User;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;
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
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT Secret not configured");

    const decoded = jwt.verify(token, secret) as { id: number };
    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError("UNAUTHORIZED", 401));
    }
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("TOKEN_EXPIRED", 401));
    }
    return next(new AppError("INVALID_TOKEN", 401));
  }
};
