import { ErrorCode, ERROR_MESSAGES } from "../constants/error.constants";

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode; // 이제 code는 필수이며, ErrorCode 타입만 허용

  // 생성자에서 ErrorCode를 필수로 받음
  constructor(code: ErrorCode, statusCode: number) {
    // code에 해당하는 메시지를 ERROR_MESSAGES에서 찾아 설정
    super(ERROR_MESSAGES[code]);

    this.statusCode = statusCode;
    this.code = code;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
