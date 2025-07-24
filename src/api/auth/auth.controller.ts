import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import authService from "./auth.service";
import { registerUserSchema } from "./dtos/auth.dto";
import { AppError } from "../../utils/AppError"; // AppError도 import 되어 있는지 확인
import { User } from "../../models/user.model";
import jwtService from "../../services/jwt.service"; // JwtService import

class AuthController {
  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const registerUserDto = registerUserSchema.parse(req.body);
    const result = await authService.registerUser(registerUserDto);
    res.status(201).json({
      success: true,
      data: result,
    });
  }

  public async checkEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const email = req.query.email as string;
    console.log(email);
    if (!email || !z.string().email().safeParse(email).success) {
      throw new AppError("INVALID_EMAIL_FORMAT", 400);
    }

    const isAvailable = await authService.checkEmailAvailability(email);

    res.status(200).json({ available: isAvailable });
  }

  public async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { token } = req.body;

    if (!token) {
      throw new AppError("VERIFICATION_TOKEN_NOT_FOUND", 400);
    }

    const userId = await authService.verifyUserEmail(token);

    const user = await authService.getUserById(userId);
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
    };

    res.status(200).json({
      message: "이메일 인증이 성공적으로 완료되었습니다.",
      data: userData,
    });
  }

  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { email, password } = req.body;

    // Zod를 사용한 간단한 검증
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });
    loginSchema.parse({ email, password });

    const result = await authService.login(email, password, req);

    res.status(200).json(result);
  }

  public async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError("INVALID_REFRESH_TOKEN", 400);
    }

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: jwtService.getAccessTokenExpiry(),
      },
    });
  }

  public async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // protect 미들웨어가 req.user에 사용자 정보를 넣어주었음
    const user = req.user as User;

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
    };

    res.status(200).json({
      success: true,
      data: userData,
    });
  }

  public async resendVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { email } = req.body;
    // 이메일 유효성 검사 추가
    if (!email || !z.string().email().safeParse(email).success) {
      throw new AppError("INVALID_EMAIL_FORMAT", 400);
    }

    await authService.resendVerificationEmail(email);
    res.status(200).json({
      success: true,
      message:
        "인증 이메일이 재전송되었습니다. 5분 안에 메일함을 확인해주세요.",
    });
  }
}

export default new AuthController();
