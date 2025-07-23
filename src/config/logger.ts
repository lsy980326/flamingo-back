import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

// 로그 출력 형식 정의
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});

export const logErrorSync = (error: any) => {
  console.error("--- UNHANDLED ERROR (SYNC LOG) ---");
  if (error instanceof Error) {
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  } else {
    console.error(error);
  }
  console.error("------------------------------------");
};

export const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf("\n")));
  },
};

export default logger;
