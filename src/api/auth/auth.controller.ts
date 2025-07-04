import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import authService from "./auth.service";
import { registerUserSchema } from "./dtos/auth.dto";
import { AppError } from "../../utils/AppError"; // AppError도 import 되어 있는지 확인

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

    await authService.verifyUserEmail(token);

    res
      .status(200)
      .json({ message: "이메일 인증이 성공적으로 완료되었습니다." });
  }
}

export default new AuthController();
