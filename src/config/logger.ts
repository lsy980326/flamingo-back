import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

// 로그 출력 형식 정의
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  // 로그 레벨: 'info' 레벨 이상의 로그만 기록
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  // 로그 저장 방식 정의
  transports: [
    // info 레벨 로그를 `logs/combined.log` 파일에 저장
    new winston.transports.File({ filename: "logs/combined.log" }),
    // error 레벨 로그를 `logs/error.log` 파일에 저장
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

// 개발 환경에서는 콘솔에도 로그를 예쁘게 출력
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(), // 로그 레벨에 따라 색상 추가
        logFormat
      ),
    })
  );
}

// Morgan과의 연동을 위한 stream 객체
export const stream = {
  write: (message: string) => {
    // morgan에서 출력하는 마지막 개행문자를 제거
    logger.info(message.substring(0, message.lastIndexOf("\n")));
  },
};

export default logger;
