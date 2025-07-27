// 1. dotenv를 가장 먼저 실행하여 모든 환경 변수를 로드합니다.
import dotenv from "dotenv";
dotenv.config();

// --- 설정 및 서비스 모듈 import ---
// logger를 먼저 import하여 동기 로깅 함수를 가져옵니다.
import logger, { stream, logErrorSync } from "./config/logger";

// 2. 처리되지 않은 예외를 잡는 글로벌 핸들러를 먼저 설정합니다.
process.on("unhandledRejection", (reason, promise) => {
  logErrorSync(reason); // 동기 로거로 즉시 출력
  logger.error("UNHANDLED REJECTION", reason); // 비동기 로거로도 기록
  // 로그가 전송될 시간을 벌기 위해 잠시 대기 후 종료
  setTimeout(() => process.exit(1), 1000);
});
process.on("uncaughtException", (error) => {
  logErrorSync(error); // 동기 로거로 즉시 출력
  logger.error("UNCAUGHT EXCEPTION", error); // 비동기 로거로도 기록
  setTimeout(() => process.exit(1), 1000);
});

// --- 애플리케이션 모듈 import ---
import "express-async-errors";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import passport from "passport";
import { ZodError } from "zod";
import { initializeKafkaProducer } from "./services/kafka.producer";

import { setupPassport } from "./config/passport";
import { setupSwagger } from "./config/swagger";
import { initializeEmailService } from "./services/email.service";

// --- 미들웨어 및 유틸리티 import ---
import { globalLimiter } from "./middleware/rateLimiter.middleware";
import { AppError } from "./utils/AppError";
import { ERROR_MESSAGES } from "./constants/error.constants";

// --- 라우터 import ---
import authRouter from "./api/auth/auth.route";
import projectRouter from "./api/projects/project.route";

async function startServer() {
  console.log("--- Initializing server modules ---");

  // 이메일 서비스 초기화
  await initializeEmailService();

  // Kafka 프로듀서 연결
  // 서버가 요청을 처리하기 전에 Kafka 연결이 완료되도록 여기에 추가합니다.
  initializeKafkaProducer();
  console.log("--- Kafka Producer connected ---");

  const app: Express = express();
  const PORT = process.env.PORT || 8000;

  app.set("trust proxy", 1);
  app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const morganFormat =
    process.env.NODE_ENV !== "production" ? "dev" : "combined";
  app.use(morgan(morganFormat, { stream }));

  app.use(passport.initialize());
  setupPassport();

  app.use(globalLimiter);

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).send("OK");
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/projects", projectRouter);

  setupSwagger(app);

  app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to Flamingo API Server!");
  });

  // 전역 에러 핸들러
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("--- API ERROR HANDLER (SYNC LOG) ---", error);
    // 비동기 winston 로거로 상세 정보 기록
    logger.error(error.stack || error.message);

    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력값이 올바르지 않습니다.",
          details: error.flatten().fieldErrors,
        },
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          ERROR_MESSAGES["INTERNAL_SERVER_ERROR"] ||
          "서버 내부 오류가 발생했습니다.",
      },
    });
  });

  app.listen(PORT, () => {
    console.log(`[Server] Server is running on port ${PORT}`);
    console.log(
      "--- Server setup complete and ready to accept connections ---"
    );
    console.log("http://localhost:8000/api-docs/");
  });
}

// 서버 시작 함수 호출 및 에러 처리
startServer().catch((error) => {
  logErrorSync(error); // 시작 실패 시에도 동기 로거 사용
  logger.error("FATAL: Failed to start server.", error);
  process.exit(1);
});
