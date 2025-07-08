import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { checkPermission } from "../../middleware/permission.middleware";
import projectController from "./project.controller";

const router = Router();

// 이 라우터의 모든 경로는 기본적으로 인증이 필요함
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: 프로젝트 생성, 조회, 수정, 삭제 API
 */

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: 새 프로젝트 생성
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 프로젝트 이름
 *     responses:
 *       201:
 *         description: 프로젝트 생성 성공
 */
router.post("/", projectController.createProject);

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: 내 프로젝트 목록 조회
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로젝트 목록 조회 성공
 */
router.get("/", projectController.getMyProjects);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: 프로젝트 정보 수정
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 프로젝트를 찾을 수 없음
 */
// 'editor' 이상의 권한이 있는지 먼저 확인
router.put("/:id", checkPermission("editor"), projectController.updateProject);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: 프로젝트 삭제 (소프트 삭제)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       403:
 *         description: 권한 없음 (소유자만 가능)
 */
// 'owner' 권한이 있는지 먼저 확인
router.delete(
  "/:id",
  checkPermission("owner"),
  projectController.deleteProject
);
export default router;
