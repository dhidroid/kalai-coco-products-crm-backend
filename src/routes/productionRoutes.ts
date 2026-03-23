import { Router, RequestHandler } from 'express';
import { authenticate } from '@middleware/auth';
import ProductionController from '@controllers/ProductionController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Productions
 *   description: Production tracking management
 */

/**
 * @swagger
 * /productions:
 *   post:
 *     summary: Log production details
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - batchNumber
 *               - quantity
 *               - unit
 *               - productionDate
 *             properties:
 *               productId:
 *                 type: integer
 *               batchNumber:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               productionDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Production logged successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate as RequestHandler, ProductionController.logProduction.bind(ProductionController) as RequestHandler);

/**
 * @swagger
 * /productions:
 *   get:
 *     summary: Get all productions
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of productions
 */
router.get('/', authenticate as RequestHandler, ProductionController.getAllProductions.bind(ProductionController) as RequestHandler);

/**
 * @swagger
 * /productions/{id}:
 *   delete:
 *     summary: Delete a production log
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Production deleted
 */
router.delete('/:id', authenticate as RequestHandler, ProductionController.deleteProduction.bind(ProductionController) as RequestHandler);

export default router;
