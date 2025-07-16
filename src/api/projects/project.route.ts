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

/**
 * @swagger
 * /api/v1/projects/{id}/collaborators:
 *   post:
 *     summary: 프로젝트에 협업자 추가
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 프로젝트 ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 초대할 사용자의 이메일
 *               role:
 *                 type: string
 *                 enum: [editor, viewer]
 *                 description: 부여할 역할
 *     responses:
 *       201:
 *         description: 협업자 추가 성공
 *       403:
 *         description: 권한 없음 (소유자만 가능)
 *       404:
 *         description: 초대할 사용자를 찾을 수 없음
 *       409:
 *         description: 이미 참여 중인 사용자
 */
// 'owner' 권한이 있는 사용자만 협업자를 추가할 수 있음
router.post(
  "/:id/collaborators",
  checkPermission("owner"),
  projectController.addCollaborator
);

/**
 * @swagger
 * /api/v1/projects/{id}/collaborators:
 *   get:
 *     summary: 프로젝트 협업자 목록 조회
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 프로젝트 ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 목록 조회 성공
 *       403:
 *         description: 권한 없음 (참여자만 가능)
 */
// 'viewer' 이상의, 즉 프로젝트 참여자라면 누구나 목록을 볼 수 있음
router.get(
  "/:id/collaborators",
  checkPermission("viewer"),
  projectController.getCollaborators
);

/**
 * @swagger
 * /api/v1/projects/{id}/collaborators/{userId}:
 *   put:
 *     summary: 협업자 역할 변경
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, description: "프로젝트 ID" }
 *       - { in: path, name: userId, required: true, description: "역할을 변경할 협업자의 ID" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [editor, viewer]
 *                 description: "새로운 역할"
 *     responses:
 *       200:
 *         description: 역할 변경 성공
 *       403:
 *         description: 권한 없음 (소유자만 가능)
 */
// 소유자만 협업자의 역할을 변경할 수 있음
router.put(
  "/:id/collaborators/:userId",
  checkPermission("owner"),
  projectController.updateCollaboratorRole
);

/**
 * @swagger
 * /api/v1/projects/{id}/collaborators/{userId}:
 *   delete:
 *     summary: 협업자 프로젝트에서 내보내기(삭제)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, description: "프로젝트 ID" }
 *       - { in: path, name: userId, required: true, description: "내보낼 협업자의 ID" }
 *     responses:
 *       200:
 *         description: 협업자 삭제 성공
 *       403:
 *         description: 권한 없음 (소유자만 가능)
 */
// 소유자만 협업자를 내보낼 수 있음
router.delete(
  "/:id/collaborators/:userId",
  checkPermission("owner"),
  projectController.removeCollaborator
);
export default router;
