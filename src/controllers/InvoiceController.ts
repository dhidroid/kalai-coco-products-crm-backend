/**
 * Invoice Controller - HTTP request handlers for invoice endpoints
 */
import { RequestHandler, Response } from 'express';
import { invoiceService } from '../services/InvoiceService';
import { logger } from '../utils/logger';
import { AuthRequest, ApiResponse } from '../types/index';
import { InvoiceHeaderInput } from '../types/invoice';

/**
 * Get dashboard summary
 */
export const getDashboardSummary: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const summary = await invoiceService.getDashboardSummary();
    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new invoice
 */
export const createInvoice: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const { 
      invoiceNumber, invoiceDate, billToUserId, shipToUserId, 
      vehicleNumber, dateOfSupply, sgstRate, cgstRate, igstRate, items,
      shipToName, shipToAddress, shipToGstin, shipToPhone
    } = req.body;

    const invoiceData: InvoiceHeaderInput = {
      invoiceNumber: invoiceNumber || invoiceService.generateInvoiceNumber(),
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      billToUserId,
      shipToUserId,
      vehicleNumber,
      dateOfSupply: dateOfSupply ? new Date(dateOfSupply) : undefined,
      sgstRate,
      cgstRate,
      igstRate,
      createdBy: req.user!.userId,
      shipToName,
      shipToAddress,
      shipToGstin,
      shipToPhone
    };

    const invoiceId = await invoiceService.createInvoice(invoiceData);

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await invoiceService.addInvoiceItem(invoiceId, item);
      }
    }

    logger.info(`Invoice created: ${invoiceData.invoiceNumber} (ID: ${invoiceId})`);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to invoice
 */
export const addInvoiceItem: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId } = req.params;
    const itemId = await invoiceService.addInvoiceItem(Number(invoiceId), req.body);

    res.status(201).json({
      success: true,
      message: 'Item added to invoice',
      data: { itemId },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoiceById(Number(invoiceId));
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices with pagination
 */
export const getAllInvoices: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const invoices = await invoiceService.getAllInvoices(limit, offset);

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download invoice PDF (Generates instantly)
 */
export const downloadInvoicePdf: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId } = req.params;
    const { pdfBuffer, invoiceNumber } = await invoiceService.generatePdfBuffer(Number(invoiceId));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;
    await invoiceService.updateInvoiceStatus(Number(invoiceId), status);

    res.json({
      success: true,
      message: `Invoice status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice: RequestHandler = async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId } = req.params;
    await invoiceService.deleteInvoice(Number(invoiceId));

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

