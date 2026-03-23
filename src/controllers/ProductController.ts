import { Request, Response } from 'express';
import { productService } from '@services/ProductService';
import { ApiResponse } from '../types/index';
import { logger } from '@utils/logger';

export class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const products = await productService.getAllProducts(limit, offset);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Products retrieved successfully',
      data: products,
    };
    res.status(200).json(response);
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const product = await productService.getProductById(Number(id));
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    };
    res.status(200).json(response);
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    const product = await productService.createProduct(req.body);
    logger.info(`Product created: ${product.product_code}`);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
    res.status(201).json(response);
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const product = await productService.updateProduct(Number(id), req.body);
    logger.info(`Product updated: ${id}`);
    
    const response: ApiResponse<any> = {
      success: true,
      message: 'Product updated successfully',
      data: product,
    };
    res.status(200).json(response);
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await productService.deleteProduct(Number(id));
    logger.info(`Product deleted: ${id}`);
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Product deleted successfully',
    };
    res.status(200).json(response);
  }
}

export default new ProductController();
