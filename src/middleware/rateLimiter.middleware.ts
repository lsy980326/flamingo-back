import rateLimit from "express-rate-limit";
import logger from "../config/logger";

// 사용자에게 보낼 에러 메시지
const message = {
  success: false,
  error: {
    code: "TOO_MANY_REQUESTS",
    message: "요청 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
};

// 모든 API에 적용할 일반적인 리미터
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 200, // 15분 동안 IP당 200회 요청 가능
  standardHeaders: true, // RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset 헤더 포함
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
  handler: (req, res, next, options) => {
    logger.warn(
      `Rate limit exceeded for ${req.ip}: ${req.method} ${req.originalUrl}`
    );
    res.status(options.statusCode).json(message);
  },
});

// 인증 관련 API(로그인, 회원가입 등)에 적용할 더 엄격한 리미터
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 15분 동안 IP당 10회 요청 가능 (로그인 시도 등)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(
      `Auth rate limit exceeded for ${req.ip}: ${req.method} ${req.originalUrl}`
    );
    res.status(options.statusCode).json(message);
  },
});
