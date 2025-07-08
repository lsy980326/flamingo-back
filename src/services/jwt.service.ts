// src/services/jwt.service.ts

import jwt, { Secret } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User, UserModel } from "../models/user.model";
import { SessionModel } from "../models/session.model";
import { AppError } from "../utils/AppError";
import logger from "../config/logger";

interface TokenPayload {
  id: number;
  email: string;
}

class JwtService {
  private getJwtSecret(): Secret {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error("FATAL ERROR: JWT_SECRET is not defined.");
      return "default_secret_for_dev_only";
    }
    return secret;
  }

  public generateAccessToken(user: User): string {
    const payload: TokenPayload = { id: user.id, email: user.email };
    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
    });
  }

  // ... 나머지 메소드들은 그대로 ...
  public async generateTokens(
    user: User,
    deviceInfo: string,
    ipAddress: string | undefined
  ) {
    // ipAddress 타입 수정
    const accessToken = this.generateAccessToken(user);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await this.storeRefreshToken(user.id, refreshToken, deviceInfo, ipAddress);
    return { accessToken, refreshToken };
  }
  private async storeRefreshToken(
    userId: number,
    token: string,
    deviceInfo: string,
    ipAddress: string | undefined
  ) {
    await SessionModel.controlSessionCount(userId, 3);
    const refreshTokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(
      Date.now() +
        this.parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || "7d") * 1000
    );
    await SessionModel.create({
      userId,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    });
  }
  public async refreshAccessToken(token: string): Promise<string> {
    const session = await SessionModel.findByToken(token);
    if (!session) throw new AppError("INVALID_REFRESH_TOKEN", 401);
    if (new Date() > new Date(session.expires_at)) {
      await SessionModel.deleteById(session.id);
      throw new AppError("INVALID_REFRESH_TOKEN", 401);
    }
    const user = await UserModel.findById(session.user_id);
    if (!user) throw new AppError("INVALID_REFRESH_TOKEN", 401);
    return this.generateAccessToken(user);
  }
  public getAccessTokenExpiry(): number {
    return this.parseExpiry(process.env.JWT_ACCESS_EXPIRES_IN || "1h");
  }
  private parseExpiry(expiry: string): number {
    const value = parseInt(expiry.slice(0, -1), 10);
    if (isNaN(value)) return 3600;
    switch (expiry.slice(-1)) {
      case "d":
        return value * 24 * 3600;
      case "h":
        return value * 3600;
      case "m":
        return value * 60;
      default:
        return value;
    }
  }
}
export default new JwtService();
