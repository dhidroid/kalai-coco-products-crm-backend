import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/index';
import productController from '@controllers/ProductController';
import { validate } from '@middleware/validate';
import { createProductSchema, updateProductSchema } from '../utils/validation';

const router = Router();

router.get('/', authenticate, productController.getAllProducts);
router.get('/:id', authenticate, productController.getProductById);
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createProductSchema), productController.createProduct);
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), productController.deleteProduct);

export const productRoutes = router;

