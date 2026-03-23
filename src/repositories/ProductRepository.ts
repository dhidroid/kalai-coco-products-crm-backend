import { BaseRepository } from './BaseRepository';

export interface ProductRow {
  product_id: number;
  product_code: string;
  product_name: string;
  description?: string;
  hsn_code?: string;
  unit: string;
  price: number;
  tax_rate: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ProductRepository extends BaseRepository {
  async getAll(limit: number = 10, offset: number = 0): Promise<ProductRow[]> {
    const result = await this.query(
      `SELECT * FROM products 
       WHERE is_deleted = FALSE 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`, 
      [limit, offset]
    );
    return result.rows;
  }

  async getById(id: number): Promise<ProductRow | null> {
    const result = await this.query(`SELECT * FROM products WHERE product_id = $1 AND is_deleted = FALSE`, [id]);
    return result.rows[0] || null;
  }

  async getByCode(code: string): Promise<ProductRow | null> {
    const result = await this.query(`SELECT * FROM products WHERE product_code = $1 AND is_deleted = FALSE`, [code]);
    return result.rows[0] || null;
  }

  async create(data: {
    productCode: string;
    productName: string;
    description?: string;
    hsnCode?: string;
    unit?: string;
    price: number;
    taxRate?: number;
  }): Promise<number> {
    const result = await this.query(
      `INSERT INTO products (
        product_code, product_name, description, hsn_code, unit, price, tax_rate, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING product_id`,
      [
        data.productCode,
        data.productName,
        data.description || null,
        data.hsnCode || null,
        data.unit || 'KG',
        data.price,
        data.taxRate || 18.0
      ]
    );
    return result.rows[0].product_id;
  }

  async update(id: number, updates: any): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    const mapping: any = {
      productCode: 'product_code',
      productName: 'product_name',
      description: 'description',
      hsnCode: 'hsn_code',
      unit: 'unit',
      price: 'price',
      taxRate: 'tax_rate',
      isActive: 'is_active'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (mapping[key] !== undefined) {
        fields.push(`${mapping[key]} = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await this.query(
      `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE product_id = $${i}`,
      values
    );
  }

  async softDelete(id: number): Promise<void> {
    await this.callProcedure('sp_delete_product', [id]);
  }
}
