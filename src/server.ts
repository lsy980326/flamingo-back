import dotenv from "dotenv";
dotenv.config();

import "express-async-errors";
import { ZodError } from "zod";
import morgan from "morgan";
import logger, { stream } from "./config/logger";

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupSwagger } from "./config/swagger";
import authRouter from "./api/auth/auth.route";
import { AppError } from "./utils/AppError"; // AppError도 import 합니다.

const app: Express = express();
const PORT = process.env.PORT || 8000;

//모르간 로깅
const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combined";
app.use(morgan(morganFormat, { stream }));

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우터
app.use("/api/v1/auth", authRouter);

// Swagger UI
setupSwagger(app);

// 기본 라우트
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Flamingo API Server! (TypeScript)");
});

// 전역 에러 핸들러
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(error.stack || error.message);

  // Zod 에러 처리
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "입력값이 올바르지 않습니다.",
        // .flatten()으로 에러 메시지를 필드별로 보기 좋게 가공
        details: error.flatten().fieldErrors,
      },
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      // error 객체에 code와 message를 모두 담아 반환
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // AppError가 아닌 예상치 못한 에러는 INTERNAL_SERVER_ERROR로 처리
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: ERROR_MESSAGES["INTERNAL_SERVER_ERROR"],
    },
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
  console.log(
    `[server]: API Docs available at http://localhost:${PORT}/api-docs`
  );
});
