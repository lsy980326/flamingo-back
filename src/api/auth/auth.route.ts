import { Router } from "express";
import authController from "./auth.controller";

const router = Router();

// Swagger JSDoc 주석은 JavaScript 버전과 동일하게 작성합니다.
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
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
router.post("/register", authController.register);

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

export default router;
