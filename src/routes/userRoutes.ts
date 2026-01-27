import { Router, RequestHandler } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import UserController from '@controllers/UserController';
import { UserRole } from '../types/index';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, UserController.getAllUsers.bind(UserController) as RequestHandler);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate as RequestHandler, UserController.getUserById.bind(UserController) as RequestHandler);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user, guest]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, UserController.createUser.bind(UserController) as RequestHandler);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', authenticate as RequestHandler, UserController.updateUser.bind(UserController) as RequestHandler);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, UserController.deleteUser.bind(UserController) as RequestHandler);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Change user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user, guest]
 *     responses:
 *       200:
 *         description: User role changed successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/role', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, UserController.changeRole.bind(UserController) as RequestHandler);

export default router;
