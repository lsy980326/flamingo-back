// 에러 코드 타입 정의
export type ErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "VALIDATION_ERROR"
  | "INVALID_EMAIL_FORMAT"
  | "INTERNAL_SERVER_ERROR"
  | "NOT_FOUND"
  | "REQUIRED_PRIVACY"
  | "VERIFICATION_TOKEN_NOT_FOUND"
  | "VERIFICATION_TOKEN_EXPIRED"
  | "VERIFICATION_TOKEN_ALREADY_USED";

// 에러 코드와 메시지 매핑 객체
export const ERROR_MESSAGES: { [key in ErrorCode]: string } = {
  EMAIL_ALREADY_EXISTS: "이미 사용 중인 이메일입니다.",
  VALIDATION_ERROR: "입력값이 올바르지 않습니다.",
  INVALID_EMAIL_FORMAT: "올바른 이메일 형식이 아닙니다.",
  INTERNAL_SERVER_ERROR: "서버 내부 오류가 발생했습니다.",
  NOT_FOUND: "요청하신 리소스를 찾을 수 없습니다.",
  REQUIRED_PRIVACY: "필수 약관에 동의해야 합니다.",
  VERIFICATION_TOKEN_NOT_FOUND: "유효하지 않은 인증 토큰입니다.",
  VERIFICATION_TOKEN_EXPIRED: "인증 토큰이 만료되었습니다. 다시 시도해주세요.",
  VERIFICATION_TOKEN_ALREADY_USED: "이미 사용된 인증 토큰입니다.",
};
