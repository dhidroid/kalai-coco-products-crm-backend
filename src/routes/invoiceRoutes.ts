import { Router } from 'express';
import {
  createInvoice,
  addInvoiceItem,
  getInvoiceById,
  getAllInvoices,
  downloadInvoicePdf,
  updateInvoiceStatus,
  deleteInvoice,
  getDashboardSummary
} from '../controllers/InvoiceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/index';
import { validate } from '@middleware/validate';
import { createInvoiceSchema, addInvoiceItemSchema } from '../utils/validation';

const router = Router();

router.get('/summary', authenticate, getDashboardSummary);
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createInvoiceSchema), createInvoice);
router.get('/', authenticate, getAllInvoices);
router.get('/:invoiceId', authenticate, getInvoiceById);
router.post('/:invoiceId/items', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(addInvoiceItemSchema), addInvoiceItem);
router.get('/:invoiceId/pdf', authenticate, downloadInvoicePdf);
router.patch('/:invoiceId/status', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), updateInvoiceStatus);
router.delete('/:invoiceId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), deleteInvoice);

export const invoiceRoutes = router;

