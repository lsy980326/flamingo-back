import bcrypt from "bcrypt";
import crypto from "crypto";
import jwtService from "../../services/jwt.service"; // 새로 만든 JwtService import
import { Request } from "express"; // Request 타입을 가져오기 위해 import
import jwt from "jsonwebtoken";
import {
  UserModel,
  EmailVerificationModel,
  User,
} from "../../models/user.model";
import { RegisterUserDto } from "./dtos/auth.dto";
import { AppError } from "../../utils/AppError";
import {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
} from "../../constants/error.constants";
import logger from "../../config/logger";
import { sendVerificationEmail } from "../../services/email.service";
import db from "../../config/db";

class AuthService {
  public async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, agree_terms, agree_privacy } = registerUserDto;

    if (!agree_terms || !agree_privacy) {
      throw new AppError("REQUIRED_PRIVACY", 400);
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError("EMAIL_ALREADY_EXISTS", 409);
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = await UserModel.create({
      ...registerUserDto,
      password_hash,
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await EmailVerificationModel.create(newUser.id, verificationToken);

    await sendVerificationEmail(newUser.email, verificationToken);

    return {
      message: "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
      user_id: newUser.id,
      email: newUser.email,
    };
  }

  public async checkEmailAvailability(email: string): Promise<boolean> {
    const existingUser = await UserModel.findByEmail(email);
    return !existingUser; // 사용자가 없으면 true (사용 가능), 있으면 false (중복)
  }

  public async verifyUserEmail(token: string): Promise<number> {
    const verification = await EmailVerificationModel.findByToken(token); // findByToken 메소드 추가 필요

    if (!verification) {
      throw new AppError("VERIFICATION_TOKEN_NOT_FOUND", 404);
    }
    if (verification.verified_at) {
      throw new AppError("VERIFICATION_TOKEN_ALREADY_USED", 400);
    }
    if (new Date() > new Date(verification.expires_at)) {
      throw new AppError("VERIFICATION_TOKEN_EXPIRED", 400);
    }

    // DB 트랜잭션 시작
    const client = await db.getClient(); // Pool에서 클라이언트 가져오기
    try {
      await client.query("BEGIN");

      // 1. users 테이블 업데이트
      const userUpdateQuery = `UPDATE users SET status = 'active', email_verified = true, email_verified_at = CURRENT_TIMESTAMP WHERE id = $1`;
      await client.query(userUpdateQuery, [verification.user_id]);

      // 2. email_verifications 테이블 업데이트
      const verificationUpdateQuery = `UPDATE email_verifications SET verified_at = CURRENT_TIMESTAMP WHERE id = $1`;
      await client.query(verificationUpdateQuery, [verification.id]);

      await client.query("COMMIT");

      return verification.user_id;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Email verification transaction failed", error);
      throw new AppError("INTERNAL_SERVER_ERROR", 500);
    } finally {
      client.release(); // 사용한 클라이언트 반환
    }
  }

  public async getUserById(userId: number): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("NOT_FOUND", 404);
    }
    return user;
  }

  public async login(
    email: string,
    password: string,
    req: Request
  ): Promise<{
    token: { access_token: string; refreshToken: string };
    user: { id: number; name: string; user_type: string };
  }> {
    const user = await UserModel.findByEmail(email);

    // 1. (가장 먼저) 계정 잠금 상태 확인
    if (user && user.locked_until && new Date() < new Date(user.locked_until)) {
      // 아직 잠금 시간이 해제되지 않았음
      throw new AppError("ACCOUNT_LOCKED", 423); // 423 Locked
    }

    // 2. 사용자 존재 여부 및 비밀번호 일치 확인
    if (!user || !user.password_hash) {
      throw new AppError("LOGIN_FAILED", 401);
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    // 3. 비밀번호 불일치 시 (로그인 실패 처리)
    if (!isPasswordMatch) {
      // 3-1. 실패 횟수 1 증가시키고, 업데이트된 사용자 정보 반환
      const updatedUser = await UserModel.incrementFailedAttempts(user.id);

      // 3-2. 실패 횟수가 임계점에 도달했는지 확인
      if (updatedUser.failed_attempts >= MAX_LOGIN_ATTEMPTS) {
        // 3-3. 계정 잠금 처리
        await UserModel.lockAccount(user.id, LOCKOUT_DURATION_MINUTES);
        // 잠겼다는 사실을 즉시 알림
        throw new AppError("ACCOUNT_LOCKED", 423);
      }

      // 아직 잠기지 않았다면, 일반적인 로그인 실패 에러 반환
      throw new AppError("LOGIN_FAILED", 401);
    }

    // 4. (로그인 성공 시) 계정 활성화 상태 확인
    if (user.status !== "active") {
      throw new AppError("ACCOUNT_NOT_ACTIVE", 403);
    }

    // 5. (로그인 성공 시) 실패 기록 초기화
    // 실패 기록이 있는 경우에만 초기화 쿼리 실행
    if (user.failed_attempts > 0) {
      await UserModel.resetLoginAttempts(user.id);
    }

    const deviceInfo = req.headers["user-agent"] || "Unknown Device";
    const ipAddress = req.ip;
    const { accessToken, refreshToken } = jwtService.generateTokens(
      user,
      deviceInfo,
      ipAddress
    );

    // 마지막 로그인 시간 업데이트
    UserModel.updateLastLogin(user.id).catch((err) =>
      logger.error("Failed to update last login", err)
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        user_type: user.user_type,
      },
      token: {
        access_token: accessToken,
        refreshToken: refreshToken,
      },
    };
  }
  public async refreshToken(token: string): Promise<{ accessToken: string }> {
    const newAccessToken = await jwtService.refreshAccessToken(token); // JwtService에 해당 메소드 구현 필요
    return { accessToken: newAccessToken };
  }
}

export default new AuthService();
