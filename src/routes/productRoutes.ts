import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/index';
import { productService } from '../services/ProductService';
import { ValidationError } from '../utils/errors';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const products = await productService.getAllProducts(limit, offset);
    const total = await productService.getProductCount();

    res.json({
      success: true,
      data: products,
      pagination: { page, limit, offset, total },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:productId', authenticate, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await productService.getProductById(Number(productId));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { productCode, productName, description, hsnCode, unit, price, taxRate, isActive } =
        req.body;

      if (!productCode || !productName || price === undefined) {
        throw new ValidationError('Missing required fields: productCode, productName, price');
      }

      const product = await productService.createProduct({
        productCode,
        productName,
        description,
        hsnCode,
        unit: unit || 'KG',
        price,
        taxRate: taxRate || 18.0,
        isActive: isActive !== false,
      });

      res.status(201).json({ success: true, message: 'Product created', data: product });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:productId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { productCode, productName, description, hsnCode, unit, price, taxRate, isActive } =
        req.body;

      const product = await productService.updateProduct(Number(productId), {
        productCode,
        productName,
        description,
        hsnCode,
        unit,
        price,
        taxRate,
        isActive,
      });

      res.json({ success: true, message: 'Product updated', data: product });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:productId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      await productService.deleteProduct(Number(productId));
      res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export const productRoutes = router;
