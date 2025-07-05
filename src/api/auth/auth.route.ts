import { Router } from "express";
import authController from "./auth.controller";
import passport from "passport";
import jwt from "jsonwebtoken";
import { protect } from "../../middleware/auth.middleware";
import { authLimiter } from "../../middleware/rateLimiter.middleware";

const router = Router();

// Swagger JSDoc 주석은 JavaScript 버전과 동일하게 작성합니다.
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API 구글 로그인 테스트(http://localhost:8000/api/v1/auth/google)
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 일반 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               user_type:
 *                 type: string
 *                 enum: [artist, student, teacher]
 *               agree_terms:
 *                 type: boolean
 *               agree_privacy:
 *                 type: boolean
 *               agree_marketing:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       409:
 *         description: 이메일 중복
 *       500:
 *         description: 서버 오류
 */
router.post("/register", authLimiter, authController.register);

/**
 * @swagger
 * /api/v1/auth/check-email:
 *   get:
 *     summary: 이메일 중복 확인
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: 중복 확인할 이메일
 *     responses:
 *       200:
 *         description: 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   description: true면 사용 가능, false면 중복
 */
router.get("/check-email", authController.checkEmail);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: 이메일 인증 처리
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: 이메일로 받은 인증 토큰
 *     responses:
 *       200:
 *         description: 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/verify-email", authController.verifyEmail);

// 구글 로그인
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// 구글 로그인 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login/failed",
    session: false,
  }),
  (req, res) => {
    // Passport가 성공적으로 인증하고 user 객체를 req.user에 담아줌
    const user = req.user as User;

    // JWT 생성
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    // TODO: 성공 시 프론트엔드의 특정 페이지로 리다이렉트하면서 토큰 전달
    // 예: res.redirect(`http://localhost:3000/auth/success?token=${token}`);
    res.status(200).json({
      message: "Google login successful",
      token,
      user,
    });
  }
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 일반 로그인 (이메일/비밀번호)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 *       401:
 *         description: 로그인 실패
 */
router.post("/login", authLimiter, authController.login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: 내 정보 조회 (인증 필요)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 현재 로그인된 사용자 정보 반환
 *       401:
 *         description: 인증 실패
 */
router.get("/me", protect, authController.getMe);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 액세스 토큰 재발급
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 새로운 액세스 토큰 발급 성공
 */
router.post("/refresh", authController.refreshToken);

export default router;
