import { query } from '@config/database';
import type { Product, ProductInput } from '../types/index';
import { ValidationError, NotFoundError } from '@utils/errors';

export class ProductService {
  async getAllProducts(limit: number, offset: number): Promise<Product[]> {
    const result = await query(
      `SELECT product_id, product_code, product_name, description, hsn_code, unit, price, tax_rate, is_active, created_at, updated_at
       FROM products 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async getProductCount(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM products', []);
    return Number(result.rows[0].count);
  }

  async getProductById(id: number): Promise<Product> {
    const result = await query(
      `SELECT product_id, product_code, product_name, description, hsn_code, unit, price, tax_rate, is_active, created_at, updated_at
       FROM products WHERE product_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }
    return result.rows[0];
  }

  async getProductByCode(code: string): Promise<Product | null> {
    const result = await query(
      `SELECT product_id, product_code, product_name, description, hsn_code, unit, price, tax_rate, is_active, created_at, updated_at
       FROM products WHERE product_code = $1`,
      [code]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  async createProduct(data: ProductInput): Promise<Product> {
    const existing = await this.getProductByCode(data.productCode);
    if (existing) {
      throw new ValidationError('Product with this code already exists');
    }

    const result = await query(
      `INSERT INTO products (product_code, product_name, description, hsn_code, unit, price, tax_rate, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.productCode,
        data.productName,
        data.description,
        data.hsnCode,
        data.unit,
        data.price,
        data.taxRate,
        data.isActive,
      ]
    );
    return result.rows[0];
  }

  async updateProduct(id: number, data: Partial<ProductInput>): Promise<Product> {
    await this.getProductById(id);

    const result = await query(
      `UPDATE products SET
        product_code = COALESCE($1, product_code),
        product_name = COALESCE($2, product_name),
        description = COALESCE($3, description),
        hsn_code = COALESCE($4, hsn_code),
        unit = COALESCE($5, unit),
        price = COALESCE($6, price),
        tax_rate = COALESCE($7, tax_rate),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
       WHERE product_id = $9
       RETURNING *`,
      [
        data.productCode,
        data.productName,
        data.description,
        data.hsnCode,
        data.unit,
        data.price,
        data.taxRate,
        data.isActive,
        id,
      ]
    );
    return result.rows[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await this.getProductById(id);
    await query('DELETE FROM products WHERE product_id = $1', [id]);
  }
}

export const productService = new ProductService();
