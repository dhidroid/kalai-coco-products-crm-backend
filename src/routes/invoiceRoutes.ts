/**
 * Invoice Routes - API endpoints for invoice management
 */
import { Router } from 'express';
import {
  createInvoice,
  addInvoiceItem,
  getInvoiceById,
  getInvoiceByNumber,
  getAllInvoices,
  generateInvoicePreview,
  downloadInvoicePdf,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoiceNumber,
  generateAndSaveInvoicePdf,
} from '../controllers/InvoiceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/index';

const router = Router();

/**
 * @swagger
 * /invoices/generate-number:
 *   get:
 *     summary: Generate new invoice number
 *     description: Generate a unique invoice number for new invoices
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice number generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoiceNumber:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/generate-number', authenticate, generateInvoiceNumber);

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create new invoice
 *     description: Create a new invoice with header information
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceNumber
 *               - invoiceDate
 *               - billToUserId
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *                 example: INV-250127-0001
 *               invoiceDate:
 *                 type: string
 *                 format: date-time
 *               billToUserId:
 *                 type: number
 *               shipToUserId:
 *                 type: number
 *               vehicleNumber:
 *                 type: string
 *               dateOfSupply:
 *                 type: string
 *                 format: date-time
 *               sgstRate:
 *                 type: number
 *                 default: 9.0
 *               cgstRate:
 *                 type: number
 *                 default: 9.0
 *               igstRate:
 *                 type: number
 *                 default: 0.0
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoiceId:
 *                       type: number
 *                     invoiceNumber:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), createInvoice);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve all invoices with pagination
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getAllInvoices);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     description: Retrieve invoice details with all items
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:invoiceId', authenticate, getInvoiceById);

/**
 * @swagger
 * /invoices/number/{invoiceNumber}:
 *   get:
 *     summary: Get invoice by number
 *     description: Retrieve invoice details by invoice number
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/number/:invoiceNumber', authenticate, getInvoiceByNumber);

/**
 * @swagger
 * /invoices/{invoiceId}/items:
 *   post:
 *     summary: Add item to invoice
 *     description: Add a product item to an invoice
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - unitPrice
 *             properties:
 *               productId:
 *                 type: number
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               rate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:invoiceId/items', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), addInvoiceItem);

/**
 * @swagger
 * /invoices/{invoiceId}/preview:
 *   get:
 *     summary: Generate invoice HTML preview
 *     description: Generate and return HTML preview of invoice
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Invoice HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:invoiceId/preview', authenticate, generateInvoicePreview);

/**
 * @swagger
 * /invoices/{invoiceId}/pdf:
 *   get:
 *     summary: Download invoice PDF
 *     description: Download the generated PDF file of invoice
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice or PDF not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:invoiceId/pdf', authenticate, downloadInvoicePdf);

/**
 * @swagger
 * /invoices/{invoiceId}/status:
 *   patch:
 *     summary: Update invoice status
 *     description: Update the status of an invoice
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, finalized, sent, paid, cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:invoiceId/status', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), updateInvoiceStatus);

/**
 * @swagger
 * /api/invoices/{invoiceId}:
 *   delete:
 *     summary: Delete invoice
 *     description: Delete an invoice and all associated items
 *     tags:
 *       - Invoices
/**
 * @swagger
 * /invoices/{invoiceId}/generate-pdf:
 *   post:
 *     summary: Generate and save invoice PDF
 *     description: Generate PDF from invoice HTML and store binary in database
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: PDF generated and saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     logId:
 *                       type: number
 *                     fileSize:
 *                       type: number
 *                     invoiceNumber:
 *                       type: string
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:invoiceId/generate-pdf', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), generateAndSaveInvoicePdf);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   delete:
 *     summary: Delete invoice
 *     description: Delete an invoice and all associated items
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized or insufficient permissions
 */
router.delete('/:invoiceId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), deleteInvoice);

export const invoiceRoutes = router;
