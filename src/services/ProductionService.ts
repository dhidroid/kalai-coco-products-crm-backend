import { BaseRepository } from '../repositories/BaseRepository';
import { logger } from '../utils/logger';
import { InternalServerError } from '../utils/errors';

export interface ProductionInput {
  productId: number;
  batchNumber: string;
  quantity: number;
  unit: string;
  productionDate: string;
  notes?: string;
  createdBy: number;
}

export interface Production {
  production_id: number;
  product_id: number;
  product_name?: string;
  batch_number: string;
  quantity: number;
  unit: string;
  production_date: string;
  notes?: string;
  created_at: string;
}

export class ProductionService extends BaseRepository {
  async logProduction(data: ProductionInput): Promise<number> {
    try {
      const result = await this.callProcedure('sp_log_production', [
        data.productId,
        data.batchNumber,
        data.quantity,
        data.unit,
        data.productionDate,
        data.notes || null,
        data.createdBy,
        null // OUT p_production_id
      ]);

      const productionId = result.rows[0].p_production_id;
      logger.info(`Production log created: ID ${productionId}`);
      return productionId;
    } catch (error) {
      logger.error(`Error logging production: ${error}`);
      throw new InternalServerError('Failed to log production data');
    }
  }

  async getAllProductions(limit: number = 50, offset: number = 0): Promise<Production[]> {
    try {
      const result = await this.query(`
        SELECT p.*, pr.product_name 
        FROM productions p
        JOIN products pr ON p.product_id = pr.product_id
        ORDER BY p.production_date DESC, p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching productions: ${error}`);
      throw new InternalServerError('Failed to fetch productions');
    }
  }

  async deleteProduction(id: number): Promise<void> {
    try {
      await this.query('DELETE FROM productions WHERE production_id = $1', [id]);
    } catch (error) {
      logger.error(`Error deleting production ${id}: ${error}`);
      throw new InternalServerError('Failed to delete production entry');
    }
  }
}

export const productionService = new ProductionService();
