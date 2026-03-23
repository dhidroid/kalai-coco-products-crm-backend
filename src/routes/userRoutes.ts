import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import UserController from '@controllers/UserController';
import { UserRole } from '../types/index';
import { validate } from '@middleware/validate';
import { createUserSchema, updateUserSchema } from '../utils/validation';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.getAllUsers);
router.get('/:id', authenticate, UserController.getUserById);
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createUserSchema), UserController.createUser);
router.put('/:id', authenticate, validate(updateUserSchema), UserController.updateUser);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.deleteUser);
router.patch('/:id/role', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserController.changeRole);

export default router;

