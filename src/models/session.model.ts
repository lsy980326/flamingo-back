import db from "../config/db";
import bcrypt from "bcrypt";

export interface Session {
  id: string;
  user_id: number;
  refresh_token_hash: string;
  device_info: string | null;
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
}

interface SessionCreateData {
  userId: number;
  refreshTokenHash: string;
  deviceInfo: string | undefined;
  ipAddress: string | undefined;
  expiresAt: Date;
}

export class SessionModel {
  static async create(data: SessionCreateData): Promise<void> {
    const { userId, refreshTokenHash, deviceInfo, ipAddress, expiresAt } = data;
    await db.query(
      "INSERT INTO sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [userId, refreshTokenHash, deviceInfo, ipAddress, expiresAt]
    );
  }
  static async controlSessionCount(
    userId: number,
    maxCount: number
  ): Promise<void> {
    const { rows } = await db.query(
      "SELECT COUNT(*) FROM sessions WHERE user_id = $1",
      [userId]
    );
    if (parseInt(rows[0].count, 10) >= maxCount) {
      await db.query(
        "DELETE FROM sessions WHERE id = (SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1)",
        [userId]
      );
    }
  }
  static async findByToken(token: string): Promise<Session | undefined> {
    const allSessions = await db.query(
      "SELECT * FROM sessions WHERE expires_at > NOW()"
    );
    for (const session of allSessions.rows) {
      const isMatch = await bcrypt.compare(token, session.refresh_token_hash);
      if (isMatch) return session;
    }
    return undefined;
  }
  static async deleteById(sessionId: string): Promise<void> {
    await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  }
}
