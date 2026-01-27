import { Router, RequestHandler } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import PriceLevelController from '@controllers/PriceLevelController';
import { UserRole } from '../types/index';

const router = Router();

/**
 * @swagger
 * /price-levels:
 *   get:
 *     summary: Get all price levels
 *     tags: [Price Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Price levels retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate as RequestHandler, PriceLevelController.getAllPriceLevels.bind(PriceLevelController) as RequestHandler);

/**
 * @swagger
 * /price-levels/{id}:
 *   get:
 *     summary: Get price level by ID
 *     tags: [Price Levels]
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
 *         description: Price level retrieved successfully
 *       404:
 *         description: Price level not found
 */
router.get('/:id', authenticate as RequestHandler, PriceLevelController.getPriceLevelById.bind(PriceLevelController) as RequestHandler);

/**
 * @swagger
 * /price-levels:
 *   post:
 *     summary: Create a new price level
 *     tags: [Price Levels]
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
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Price level created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, PriceLevelController.createPriceLevel.bind(PriceLevelController) as RequestHandler);

/**
 * @swagger
 * /price-levels/{id}:
 *   put:
 *     summary: Update price level
 *     tags: [Price Levels]
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Price level updated successfully
 *       404:
 *         description: Price level not found
 */
router.put('/:id', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, PriceLevelController.updatePriceLevel.bind(PriceLevelController) as RequestHandler);

/**
 * @swagger
 * /price-levels/{id}:
 *   delete:
 *     summary: Delete price level
 *     tags: [Price Levels]
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
 *         description: Price level deleted successfully
 *       404:
 *         description: Price level not found
 */
router.delete('/:id', authenticate as RequestHandler, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN) as RequestHandler, PriceLevelController.deletePriceLevel.bind(PriceLevelController) as RequestHandler);

export default router;
