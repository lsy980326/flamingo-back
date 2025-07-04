import db from "../config/db";
import { RegisterUserDto } from "../api/auth/dtos/auth.dto";

// 사용자 타입 정의 (이 부분은 변경 없음)
export type user_type = "artist" | "student" | "teacher";
export type user_status = "pending" | "active" | "inactive" | "suspended";

// User 인터페이스 (DB에서 반환되는 사용자 객체 타입)
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  user_type: user_type;
  status: user_status;
  agree_terms: boolean;
  agree_privacy: boolean;
  agree_marketing: boolean;
  // ... 나머지 필드들
}

// ✨ 새로운 타입 정의: 사용자 생성을 위한 데이터 타입
// RegisterUserDto에서 password를 제외하고 password_hash를 추가합니다.
type CreateUserPayload = Omit<RegisterUserDto, "password"> & {
  password_hash: string;
};

export class UserModel {
  static async findByEmail(email: string): Promise<User | undefined> {
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await db.query(query, [email]);
    return rows[0];
  }

  // ✨ 수정된 부분: 파라미터 타입을 명확한 CreateUserPayload로 변경
  static async create(userData: CreateUserPayload): Promise<User> {
    // 이제 userData에서 모든 속성을 안전하게 가져올 수 있습니다.
    const {
      email,
      password_hash,
      name,
      user_type,
      agree_terms,
      agree_privacy,
      agree_marketing,
    } = userData;
    const query = `
      INSERT INTO users (email, password_hash, name, user_type, agree_terms, agree_privacy, agree_marketing, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id, email, name, user_type, created_at
    `;
    const values = [
      email,
      password_hash,
      name,
      user_type,
      agree_terms,
      agree_privacy,
      agree_marketing || false,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }
}

export interface EmailVerification {
  // 타입 인터페이스 추가
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  verified_at: Date | null;
}

export class EmailVerificationModel {
  static async create(
    userId: number,
    token: string
  ): Promise<{ token: string }> {
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후 만료
    const query = `
            INSERT INTO email_verifications (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING token
        `;
    const { rows } = await db.query(query, [userId, token, expires_at]);
    return rows[0];
  }

  static async findByToken(
    token: string
  ): Promise<EmailVerification | undefined> {
    const query = "SELECT * FROM email_verifications WHERE token = $1";
    const { rows } = await db.query(query, [token]);
    return rows[0];
  }
}
