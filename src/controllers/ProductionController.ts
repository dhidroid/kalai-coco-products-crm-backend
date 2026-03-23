import { Request, Response } from 'express';
import { logger } from '@utils/logger';
import { productionService } from '@services/ProductionService';
import { ApiResponse, AuthRequest } from '../types/index';

export class ProductionController {
  async logProduction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId, batchNumber, quantity, unit, productionDate, notes } = req.body;
      const userId = req.user?.userId;

      if (!productId || !batchNumber || !quantity || !unit || !productionDate) {
        res.status(400).json({ success: false, message: 'All required fields are missing' });
        return;
      }

      const id = await productionService.logProduction({
        productId,
        batchNumber,
        quantity,
        unit,
        productionDate,
        notes,
        createdBy: userId!,
      });

      logger.info('Production logged successfully', { productionId: id, productId, userId });

      const response: ApiResponse<any> = {
        success: true,
        message: 'Production logged successfully',
        data: { productionId: id },
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error logging production', { error: error.message, body: req.body });
      res.status(500).json({ success: false, message: 'Error logging production' });
    }
  }

  async getAllProductions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const productions = await productionService.getAllProductions(limit, offset);

      const response: ApiResponse<any> = {
        success: true,
        message: 'Productions retrieved successfully',
        data: productions,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching productions', { error: error.message });
      res.status(500).json({ success: false, message: 'Error fetching productions' });
    }
  }

  async deleteProduction(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await productionService.deleteProduction(id);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Production deleted successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting production', { error: error.message, id: req.params.id });
      res.status(500).json({ success: false, message: 'Error deleting production' });
    }
  }
}

export default new ProductionController();
