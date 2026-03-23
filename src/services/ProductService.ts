import { ProductRepository, ProductRow } from '../repositories/ProductRepository';
import { Product, ProductInput } from '../types/index';
import { ValidationError, NotFoundError } from '../utils/errors';

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  private mapRowToProduct(row: ProductRow): Product {
    return {
      product_id: Number(row.product_id),
      product_code: row.product_code,
      product_name: row.product_name,
      description: row.description,
      hsn_code: row.hsn_code,
      unit: row.unit,
      price: Number(row.price),
      tax_rate: Number(row.tax_rate),
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getAllProducts(limit: number = 10, offset: number = 0): Promise<Product[]> {
    const rows = await this.productRepository.getAll(limit, offset);
    return rows.map(row => this.mapRowToProduct(row));
  }

  async getProductCount(): Promise<number> {
    const rows = await this.productRepository.getAll(100000, 0); // Temporary simplified count
    return rows.length;
  }

  async getProductById(id: number): Promise<Product> {
    const row = await this.productRepository.getById(id);
    if (!row) {
      throw new NotFoundError('Product not found');
    }
    return this.mapRowToProduct(row);
  }

  async getProductByCode(code: string): Promise<Product | null> {
    const row = await this.productRepository.getByCode(code);
    if (!row) return null;
    return this.mapRowToProduct(row);
  }

  async createProduct(data: ProductInput): Promise<Product> {
    const existing = await this.getProductByCode(data.productCode);
    if (existing) {
      throw new ValidationError('Product with this code already exists');
    }

    const productId = await this.productRepository.create(data);
    const product = await this.productRepository.getById(productId);
    return this.mapRowToProduct(product!);
  }

  async updateProduct(id: number, data: Partial<ProductInput>): Promise<Product> {
    await this.getProductById(id);
    await this.productRepository.update(id, data);
    return this.getProductById(id);
  }

  async deleteProduct(id: number): Promise<void> {
    await this.getProductById(id);
    await this.productRepository.softDelete(id);
  }
}

export const productService = new ProductService();

