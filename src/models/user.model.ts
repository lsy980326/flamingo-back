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

type CreateUserPayload = Omit<RegisterUserDto, "password"> & {
  password_hash?: string; // 선택사항으로 변경
  provider?: string;
  provider_id?: string;
  status?: user_status;
  email_verified?: boolean;
};

export class UserModel {
  static async findByEmail(email: string): Promise<User | undefined> {
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await db.query(query, [email]);
    return rows[0];
  }

  static async create(userData: CreateUserPayload): Promise<User> {
    const {
      email,
      password_hash,
      name,
      user_type,
      provider,
      provider_id,
      status,
      email_verified,
      agree_terms,
      agree_privacy,
      agree_marketing,
    } = userData;
    const query = `
      INSERT INTO users (email, password_hash, name, user_type, provider, provider_id, status, email_verified, agree_terms, agree_privacy, agree_marketing)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO NOTHING
      RETURNING *
    `;
    // 소셜 로그인 시 user_type이 없으므로 기본값 'artist'로 설정
    const values = [
      email,
      password_hash,
      name,
      user_type || "artist",
      provider || "email",
      provider_id,
      status || "pending",
      email_verified || false,
      agree_terms,
      agree_privacy,
      agree_marketing || false,
    ];
    const { rows } = await db.query(query, values);
    // ON CONFLICT로 인해 삽입이 안된 경우, 기존 유저를 다시 조회
    if (rows.length === 0) {
      return this.findByEmail(email) as Promise<User>;
    }
    return rows[0];
  }

  static async updateProvider(
    userId: number,
    provider: string,
    providerId: string
  ): Promise<User> {
    const query = `
        UPDATE users SET provider = $1, provider_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
    `;
    const { rows } = await db.query(query, [provider, providerId, userId]);
    return rows[0];
  }

  static async findById(id: number): Promise<User | undefined> {
    const query = "SELECT * FROM users WHERE id = $1";
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async updateLastLogin(userId: number): Promise<void> {
    const query =
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1";
    await db.query(query, [userId]);
  }

  static async incrementFailedAttempts(userId: number): Promise<User> {
    const query = `
        UPDATE users
        SET failed_attempts = failed_attempts + 1
        WHERE id = $1
        RETURNING *;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows[0];
  }

  static async lockAccount(
    userId: number,
    durationMinutes: number
  ): Promise<void> {
    const query = `
        UPDATE users
        SET locked_until = NOW() + INTERVAL '${durationMinutes} minutes'
        WHERE id = $1;
    `;
    await db.query(query, [userId]);
  }

  static async resetLoginAttempts(userId: number): Promise<void> {
    const query = `
        UPDATE users
        SET failed_attempts = 0, locked_until = NULL
        WHERE id = $1;
    `;
    await db.query(query, [userId]);
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
