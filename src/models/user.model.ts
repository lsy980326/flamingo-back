import db from "../config/db";

export type user_status =
  | "pending"
  | "active"
  | "inactive"
  | "suspended"
  | "locked";
export type user_type = "artist" | "student" | "teacher" | "creator";

export interface User {
  id: number;
  email: string;
  password_hash: string | null;
  name: string;
  user_type: user_type;
  provider: string | null;
  provider_id: string | null;
  status: user_status;
  email_verified: boolean;
  email_verified_at: Date | null;
  agree_terms: boolean;
  agree_privacy: boolean;
  agree_marketing: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  failed_attempts: number;
  locked_until: Date | null;
}

export type CreateUserPayload = Partial<
  Omit<User, "id" | "created_at" | "updated_at">
>;

// ... 나머지 UserModel 클래스 코드는 이전과 동일 ...
export class UserModel {
  static async findByEmail(email: string): Promise<User | undefined> {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0];
  }
  static async findById(id: number): Promise<User | undefined> {
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
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
    const values = [
      email,
      password_hash,
      name,
      user_type || "creator",
      provider || "email",
      provider_id,
      status || "pending",
      !!email_verified,
      !!agree_terms,
      !!agree_privacy,
      !!agree_marketing,
    ];
    const { rows } = await db.query(
      "INSERT INTO users (email, password_hash, name, user_type, provider, provider_id, status, email_verified, agree_terms, agree_privacy, agree_marketing) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (email) DO NOTHING RETURNING *",
      values
    );
    if (rows.length === 0) return this.findByEmail(email!) as Promise<User>;
    return rows[0];
  }
  static async updateProvider(
    userId: number,
    provider: string,
    providerId: string
  ): Promise<User> {
    const { rows } = await db.query(
      "UPDATE users SET provider = $1, provider_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [provider, providerId, userId]
    );
    return rows[0];
  }
  static async updateLastLogin(userId: number): Promise<void> {
    await db.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
      [userId]
    );
  }
  static async incrementFailedAttempts(userId: number): Promise<User> {
    const { rows } = await db.query(
      "UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = $1 RETURNING *;",
      [userId]
    );
    return rows[0];
  }
  static async lockAccount(
    userId: number,
    durationMinutes: number
  ): Promise<void> {
    await db.query(
      `UPDATE users SET locked_until = NOW() + INTERVAL '${durationMinutes} minutes' WHERE id = $1;`,
      [userId]
    );
  }
  static async resetLoginAttempts(userId: number): Promise<void> {
    await db.query(
      "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1;",
      [userId]
    );
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
