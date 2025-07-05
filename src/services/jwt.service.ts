import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { SessionModel } from "../models/session.model";
import { UserModel } from "../models/user.model";

interface TokenPayload {
  id: number;
  email: string;
}

class JwtService {
  public generateTokens(user: User, deviceInfo: string, ipAddress: string) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = crypto.randomBytes(32).toString("hex");

    // 리프레시 토큰 DB에 저장 (비동기 처리)
    this.storeRefreshToken(user.id, refreshToken, deviceInfo, ipAddress).catch(
      (err) => {
        // 에러 로깅
      }
    );

    return { accessToken, refreshToken };
  }

  public generateAccessToken(user: User): string {
    const payload: TokenPayload = { id: user.id, email: user.email };
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
    });
  }

  private async storeRefreshToken(
    userId: number,
    token: string,
    deviceInfo: string,
    ipAddress: string
  ) {
    // 동시 세션 제어 로직 (최대 3개)
    await SessionModel.controlSessionCount(userId, 3);

    const refreshTokenHash = await bcrypt.hash(token, 10);
    const expiresAtSeconds = this.parseExpiry(
      process.env.JWT_REFRESH_EXPIRES_IN || "7d"
    );
    const expiresAt = new Date(Date.now() + expiresAtSeconds * 1000);

    await SessionModel.create({
      userId,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    });
  }

  // '7d', '1h' 같은 문자열을 초 단위로 변환하는 헬퍼 함수
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    switch (unit) {
      case "d":
        return value * 24 * 60 * 60;
      case "h":
        return value * 60 * 60;
      case "m":
        return value * 60;
      default:
        return value;
    }
  }

  public async refreshAccessToken(token: string): Promise<string> {
    // 1. DB에서 해당 리프레시 토큰 세션 조회
    const session = await SessionModel.findByToken(token); // 이 메소드는 모든 세션을 조회해야 함
    if (!session) {
      throw new AppError("INVALID_REFRESH_TOKEN", 401);
    }

    // 2. 토큰 만료 여부 확인
    if (new Date() > new Date(session.expires_at)) {
      await SessionModel.deleteById(session.id); // 만료된 토큰은 DB에서 삭제
      throw new AppError("INVALID_REFRESH_TOKEN", 401);
    }

    // 3. 사용자 정보 조회
    const user = await UserModel.findById(session.user_id);
    if (!user) {
      throw new AppError("INVALID_REFRESH_TOKEN", 401);
    }

    // 4. 새로운 액세스 토큰 생성
    return this.generateAccessToken(user);
  }

  // ✨ 만료 시간(초) 반환 헬퍼
  public getAccessTokenExpiry(): number {
    return this.parseExpiry(process.env.JWT_ACCESS_EXPIRES_IN || "1h");
  }
}

export default new JwtService();
