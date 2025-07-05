import db from "../config/db";
import bcrypt from "bcrypt";
import crypto from "crypto";

interface SessionCreateData {
  userId: number;
  refreshTokenHash: string;
  deviceInfo: string;
  ipAddress: string;
  expiresAt: Date;
}

export class SessionModel {
  static async create(data: SessionCreateData): Promise<void> {
    const { userId, refreshTokenHash, deviceInfo, ipAddress, expiresAt } = data;
    const query = `
      INSERT INTO sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [
      userId,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    ]);
  }

  // 동시 세션 제어
  static async controlSessionCount(
    userId: number,
    maxCount: number
  ): Promise<void> {
    const countQuery = "SELECT COUNT(*) FROM sessions WHERE user_id = $1";
    const { rows } = await db.query(countQuery, [userId]);
    const sessionCount = parseInt(rows[0].count, 10);

    if (sessionCount >= maxCount) {
      // 가장 오래된 세션 삭제
      const deleteQuery = `
            DELETE FROM sessions
            WHERE id = (
                SELECT id FROM sessions
                WHERE user_id = $1
                ORDER BY created_at ASC
                LIMIT 1
            )
        `;
      await db.query(deleteQuery, [userId]);
    }
  }

  static async findByToken(token: string): Promise<Session | undefined> {
    // 모든 세션을 가져오는 것은 비효율적이므로, 먼저 JWT를 디코딩해서 userId를 알아냅니다.
    // 리프레시 토큰도 JWT로 만들면 이 과정이 간단해집니다.
    // 여기서는 간단하게 모든 세션을 가져와 비교하는 방식으로 구현합니다.
    const allSessions = await db.query(
      "SELECT * FROM sessions WHERE expires_at > NOW()"
    );

    for (const session of allSessions.rows) {
      const isMatch = await bcrypt.compare(token, session.refresh_token_hash);
      if (isMatch) {
        return session;
      }
    }

    return undefined;
  }

  static async deleteById(sessionId: string): Promise<void> {
    await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  }
}
