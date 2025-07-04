import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserModel, EmailVerificationModel } from "../../models/user.model";
import { RegisterUserDto } from "./dtos/auth.dto";
import { AppError } from "../../utils/AppError";
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

  public async verifyUserEmail(token: string): Promise<void> {
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
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Email verification transaction failed", error);
      throw new AppError("INTERNAL_SERVER_ERROR", 500);
    } finally {
      client.release(); // 사용한 클라이언트 반환
    }
  }
}

export default new AuthService();
