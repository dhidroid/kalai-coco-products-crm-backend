import { Response } from 'express';
import type { AuthRequest, ApiResponse } from '../types/index';
import PriceLevelService from '@services/PriceLevelService';
import { logger } from '@utils/logger';

export class PriceLevelController {
  async getAllPriceLevels(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const priceLevels = await PriceLevelService.getAllPriceLevels({ page, limit, offset });
      const total = await PriceLevelService.getPriceLevelCount();

      const response: ApiResponse<any> = {
        success: true,
        message: 'Price levels retrieved successfully',
        data: {
          priceLevels,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async getPriceLevelById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const priceLevel = await PriceLevelService.getPriceLevelById(parseInt(id, 10));

      const response: ApiResponse<any> = {
        success: true,
        message: 'Price level retrieved successfully',
        data: priceLevel,
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async createPriceLevel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, price, currency, description } = req.body;
      const priceLevel = await PriceLevelService.createPriceLevel(
        name,
        price,
        currency,
        description
      );

      logger.info('Price level created', { name });

      const response: ApiResponse<any> = {
        success: true,
        message: 'Price level created successfully',
        data: priceLevel,
      };

      res.status(201).json(response);
    } catch (error) {
      throw error;
    }
  }

  async updatePriceLevel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const priceLevel = await PriceLevelService.updatePriceLevel(parseInt(id, 10), updates);

      logger.info('Price level updated', { id });

      const response: ApiResponse<any> = {
        success: true,
        message: 'Price level updated successfully',
        data: priceLevel,
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  async deletePriceLevel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PriceLevelService.deletePriceLevel(parseInt(id, 10));

      logger.info('Price level deleted', { id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Price level deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }
}

export default new PriceLevelController();
