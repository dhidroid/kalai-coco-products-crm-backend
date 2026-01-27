import { query } from '@config/database';
import type { PriceLevel, PaginationParams } from '../types/index';
import { ValidationError, NotFoundError } from '@utils/errors';

export class PriceLevelService {
  async createPriceLevel(
    name: string,
    price: number,
    currency: string,
    description?: string
  ): Promise<PriceLevel> {
    if (!name || price < 0 || !currency) {
      throw new ValidationError('Invalid price level data');
    }

    const result = await query(
      `INSERT INTO price_levels (name, price, currency, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, price, currency, description || null]
    );

    const priceLevel = result.rows[0];
    return {
      id: priceLevel.id,
      name: priceLevel.name,
      price: priceLevel.price,
      currency: priceLevel.currency,
      description: priceLevel.description,
      isActive: priceLevel.is_active,
      createdAt: priceLevel.created_at,
      updatedAt: priceLevel.updated_at,
    };
  }

  async getPriceLevelById(id: number): Promise<PriceLevel> {
    const result = await query('SELECT * FROM price_levels WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Price level not found');
    }

    const priceLevel = result.rows[0];
    return {
      id: priceLevel.id,
      name: priceLevel.name,
      price: priceLevel.price,
      currency: priceLevel.currency,
      description: priceLevel.description,
      isActive: priceLevel.is_active,
      createdAt: priceLevel.created_at,
      updatedAt: priceLevel.updated_at,
    };
  }

  async getAllPriceLevels(pagination?: PaginationParams): Promise<PriceLevel[]> {
    let sql = 'SELECT * FROM price_levels WHERE is_active = true ORDER BY price ASC';
    const params: any[] = [];

    if (pagination) {
      sql += ' LIMIT $1 OFFSET $2';
      params.push(pagination.limit, pagination.offset);
    }

    const result = await query(sql, params);

    return result.rows.map((priceLevel: any) => ({
      id: priceLevel.id,
      name: priceLevel.name,
      price: priceLevel.price,
      currency: priceLevel.currency,
      description: priceLevel.description,
      isActive: priceLevel.is_active,
      createdAt: priceLevel.created_at,
      updatedAt: priceLevel.updated_at,
    }));
  }

  async updatePriceLevel(id: number, updates: Partial<PriceLevel>): Promise<PriceLevel> {
    await this.getPriceLevelById(id);

    const result = await query(
      `UPDATE price_levels
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           currency = COALESCE($3, currency),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updates.name || null, updates.price || null, updates.currency || null, updates.description || null, id]
    );

    const updated = result.rows[0];
    return {
      id: updated.id,
      name: updated.name,
      price: updated.price,
      currency: updated.currency,
      description: updated.description,
      isActive: updated.is_active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async deletePriceLevel(id: number): Promise<void> {
    await this.getPriceLevelById(id);
    await query('UPDATE price_levels SET is_active = false WHERE id = $1', [id]);
  }

  async getPriceLevelCount(): Promise<number> {
    const result = await query('SELECT COUNT(*) FROM price_levels WHERE is_active = true');
    return parseInt(result.rows[0].count, 10);
  }
}

export default new PriceLevelService();
