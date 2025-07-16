// src/constants/error.constants.ts

export type ErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "VALIDATION_ERROR"
  | "INVALID_EMAIL_FORMAT"
  | "INTERNAL_SERVER_ERROR"
  | "NOT_FOUND"
  | "VERIFICATION_TOKEN_NOT_FOUND"
  | "VERIFICATION_TOKEN_EXPIRED"
  | "VERIFICATION_TOKEN_ALREADY_USED"
  | "LOGIN_FAILED"
  | "ACCOUNT_NOT_ACTIVE"
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "ACCOUNT_LOCKED"
  | "INVALID_REFRESH_TOKEN"
  | "PROFILE_NOT_FOUND"
  | "REQUIRED_TERMS"
  | "REQUIRED_PRIVACY"
  | "FORBIDDEN"
  | "PROJECT_ID_REQUIRED"
  | "PROJECT_NOT_FOUND"
  | "USER_TO_ADD_NOT_FOUND"
  | "USER_ALREADY_COLLABORATOR"
  | "CANNOT_CHANGE_OWN_ROLE"
  | "CANNOT_CHANGE_OWNER_ROLE"
  | "CANNOT_REMOVE_SELF"
  | "COLLABORATOR_NOT_FOUND";

export const ERROR_MESSAGES: { [key in ErrorCode]: string } = {
  EMAIL_ALREADY_EXISTS: "이미 사용 중인 이메일입니다.",
  VALIDATION_ERROR: "입력값이 올바르지 않습니다.",
  INVALID_EMAIL_FORMAT: "올바른 이메일 형식이 아닙니다.",
  INTERNAL_SERVER_ERROR: "서버 내부 오류가 발생했습니다.",
  NOT_FOUND: "요청하신 리소스를 찾을 수 없습니다.",
  VERIFICATION_TOKEN_NOT_FOUND: "유효하지 않은 인증 토큰입니다.",
  VERIFICATION_TOKEN_EXPIRED: "인증 토큰이 만료되었습니다.",
  VERIFICATION_TOKEN_ALREADY_USED: "이미 사용된 인증 토큰입니다.",
  LOGIN_FAILED: "이메일 또는 비밀번호가 일치하지 않습니다.",
  ACCOUNT_NOT_ACTIVE: "계정이 활성화되지 않았습니다.",
  UNAUTHORIZED: "인증이 필요합니다.",
  TOKEN_EXPIRED: "토큰이 만료되었습니다.",
  INVALID_TOKEN: "유효하지 않은 토큰입니다.",
  ACCOUNT_LOCKED: "계정이 잠겼습니다.",
  INVALID_REFRESH_TOKEN: "유효하지 않은 리프레시 토큰입니다.",
  PROFILE_NOT_FOUND: "프로필을 찾을 수 없습니다.",
  REQUIRED_TERMS: "이용약관 동의가 필요합니다.",
  REQUIRED_PRIVACY: "개인정보 처리방침 동의가 필요합니다.",
  FORBIDDEN: "이 작업에 대한 권한이 없습니다.",
  PROJECT_ID_REQUIRED: "프로젝트 ID가 필요합니다.",
  PROJECT_NOT_FOUND: "프로젝트를 찾을 수 없습니다.",
  USER_TO_ADD_NOT_FOUND: "초대하려는 사용자를 찾을 수 없습니다.",
  USER_ALREADY_COLLABORATOR: "이미 프로젝트에 참여 중인 사용자입니다.",
  CANNOT_CHANGE_OWN_ROLE: "자기 자신의 역할은 변경할 수 없습니다.",
  CANNOT_CHANGE_OWNER_ROLE: "프로젝트 소유자의 역할은 변경할 수 없습니다.",
  CANNOT_REMOVE_SELF: "자기 자신을 프로젝트에서 내보낼 수 없습니다.",
  COLLABORATOR_NOT_FOUND: "해당 협업자를 프로젝트에서 찾을 수 없습니다.",
};

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 30;
