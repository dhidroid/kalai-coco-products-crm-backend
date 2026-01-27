/**
 * Invoice Controller - HTTP request handlers for invoice endpoints
 */
import { RequestHandler } from 'express';
import { invoiceService } from '../services/InvoiceService';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import { AuthRequest } from '../types/index';
import { InvoiceHeaderInput, InvoiceItemInput, HtmlTemplateData } from '../types/invoice';
import { htmlToPdf } from '../utils/pdf';

/**
 * Create new invoice
 */
export const createInvoice: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceNumber, invoiceDate, billToUserId, shipToUserId, vehicleNumber, dateOfSupply, sgstRate, cgstRate, igstRate } = req.body;

    // Validate required fields
    if (!invoiceNumber) {
      throw new ValidationError('Missing required fields: invoiceNumber');
    } else if (!invoiceDate) {
      throw new ValidationError('Missing required fields: invoiceDate');
    } else if (!billToUserId) {
      throw new ValidationError('Missing required fields: billToUserId');
    } else if (!req.user) {
      throw new ValidationError('Missing required user information');
    } else {
        const existingInvoice = await invoiceService.getInvoiceByNumber(invoiceNumber);
    }

    const invoiceData: InvoiceHeaderInput = {
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      billToUserId,
      shipToUserId,
      vehicleNumber,
      dateOfSupply: dateOfSupply ? new Date(dateOfSupply) : undefined,
      sgstRate: sgstRate || 9.0,
      cgstRate: cgstRate || 9.0,
      igstRate: igstRate || 0.0,
      createdBy: req.user?.userId || 0,
    };

    const invoiceId = await invoiceService.createInvoice(invoiceData);

    logger.info(`Invoice created: ${invoiceNumber} (ID: ${invoiceId})`);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceId,
        invoiceNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to invoice
 */
export const addInvoiceItem: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { productId, quantity, unitPrice, rate } = req.body;

    // Validate required fields
    if (!productId || !quantity || unitPrice === undefined) {
      throw new ValidationError('Missing required fields: productId, quantity, unitPrice');
    }

    const itemData: InvoiceItemInput = {
      productId,
      quantity,
      unitPrice,
      rate,
    };

    const itemId = await invoiceService.addInvoiceItem(Number(invoiceId), itemData);

    logger.info(`Item added to invoice ${invoiceId}`);

    res.status(201).json({
      success: true,
      message: 'Item added to invoice',
      data: {
        itemId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await invoiceService.getInvoiceById(Number(invoiceId));
    const items = await invoiceService.getInvoiceItems(Number(invoiceId));

    res.json({
      success: true,
      data: {
        ...invoice,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice by number
 */
export const getInvoiceByNumber: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);
    const items = await invoiceService.getInvoiceItems(invoice.invoice_id);

    res.json({
      success: true,
      data: {
        ...invoice,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices with pagination
 */
export const getAllInvoices: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const invoices = await invoiceService.getAllInvoices(limit, offset);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate invoice HTML preview
 */
export const generateInvoicePreview: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;

    const invoiceDetail = await invoiceService.getInvoiceById(Number(invoiceId));
    const items = await invoiceService.getInvoiceItems(Number(invoiceId));

    // Prepare template data
    const templateData: HtmlTemplateData = {
      companyName: 'Kalai Coco Products',
      companyGstin: '33JZAPK2901Q1Z5',
      companyAddress: 'Ellayur, Muthuyaikanpatty omlur (TK), Salem (DT), Pin-636304',
      companyPhone: '9025973435',
      companyEmail: 'contact@kalaicocoproducts.com',
      companyWebsite: 'kalaicocoproducts.com',
      invoiceNumber: invoiceDetail.invoice_number,
      invoiceDate: new Date(invoiceDetail.invoice_date).toLocaleDateString('en-IN'),
      billToName: invoiceDetail.bill_to_name || 'N/A',
      billToAddress: invoiceDetail.bill_to_address || 'N/A',
      billToGstin: invoiceDetail.bill_to_gstin || 'N/A',
      billToPhone: invoiceDetail.bill_to_phone || 'N/A',
      shipToName: invoiceDetail.ship_to_name || invoiceDetail.bill_to_name || 'N/A',
      shipToAddress: invoiceDetail.bill_to_address || 'N/A',
      shipToGstin: invoiceDetail.ship_to_gstin || invoiceDetail.bill_to_gstin || 'N/A',
      vehicleNumber: invoiceDetail.vehicle_number || 'N/A',
      dateOfSupply: invoiceDetail.date_of_supply ? new Date(invoiceDetail.date_of_supply).toLocaleDateString('en-IN') : 'N/A',
      items: items.map((item) => ({
        description: item.description,
        hsnCode: item.hsn_code,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unit_price.toFixed(2),
        rate: (item.rate || item.unit_price).toFixed(2),
        itemTotal: item.item_total.toFixed(2),
      })),
      subtotal: invoiceDetail.subtotal.toFixed(2),
      sgstRate: invoiceDetail.sgst_rate,
      sgstAmount: invoiceDetail.sgst_amount.toFixed(2),
      cgstRate: invoiceDetail.cgst_rate,
      cgstAmount: invoiceDetail.cgst_amount.toFixed(2),
      igstRate: invoiceDetail.igst_rate,
      igstAmount: invoiceDetail.igst_amount.toFixed(2),
      totalAmount: invoiceDetail.total_amount.toFixed(2),
      bankName: 'Kalai Industries',
      accountNumber: '42805276994',
      ifscCode: 'SBIN0070805',
      branchName: 'Mohan Nager',
      termsConditions: 'Payment will be due prior to provision or delivery of goods/services.',
      contactEmail: 'contact@kalaicocoproducts.com',
      contactPhone: '9025973435',
      contactWebsite: 'kalaicocoproducts.com',
      generatedDate: new Date().toLocaleDateString('en-IN'),
      generatedBy: req.user?.email || 'System',
    };

    const html = invoiceService.renderHtmlInvoice(templateData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Download invoice PDF
 */
export const downloadInvoicePdf: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;

    const pdfData = await invoiceService.getInvoicePdf(Number(invoiceId));

    res.setHeader('Content-Type', pdfData.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${pdfData.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdfData.file_size);
    res.send(pdfData.invoice_binary);

    logger.info(`Invoice PDF downloaded: ${pdfData.invoice_number}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ValidationError('Status is required');
    }

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
export const deleteInvoice: RequestHandler = async (req: AuthRequest, res, next) => {
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

/**
 * Generate new invoice number
 */
export const generateInvoiceNumber: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const invoiceNumber = invoiceService.generateInvoiceNumber();

    res.json({
      success: true,
      data: {
        invoiceNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and save invoice PDF
 */
export const generateAndSaveInvoicePdf: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice details
    const invoiceDetail = await invoiceService.getInvoiceById(Number(invoiceId));
    const items = await invoiceService.getInvoiceItems(Number(invoiceId));

    // Prepare template data
    const templateData: HtmlTemplateData = {
      companyName: 'Kalai Coco Products',
      companyGstin: '33JZAPK2901Q1Z5',
      companyAddress: 'Ellayur, Muthuyaikanpatty omlur (TK), Salem (DT), Pin-636304',
      companyPhone: '9025973435',
      companyEmail: 'contact@kalaicocoproducts.com',
      companyWebsite: 'kalaicocoproducts.com',
      invoiceNumber: invoiceDetail.invoice_number,
      invoiceDate: new Date(invoiceDetail.invoice_date).toLocaleDateString('en-IN'),
      billToName: invoiceDetail.bill_to_name || 'N/A',
      billToAddress: invoiceDetail.bill_to_address || 'N/A',
      billToGstin: invoiceDetail.bill_to_gstin || 'N/A',
      billToPhone: invoiceDetail.bill_to_phone || 'N/A',
      shipToName: invoiceDetail.ship_to_name || invoiceDetail.bill_to_name || 'N/A',
      shipToAddress: invoiceDetail.bill_to_address || 'N/A',
      shipToGstin: invoiceDetail.ship_to_gstin || invoiceDetail.bill_to_gstin || 'N/A',
      vehicleNumber: invoiceDetail.vehicle_number || 'N/A',
      dateOfSupply: invoiceDetail.date_of_supply ? new Date(invoiceDetail.date_of_supply).toLocaleDateString('en-IN') : 'N/A',
      items: items.map((item) => ({
        description: item.description,
        hsnCode: item.hsn_code,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unit_price.toFixed(2),
        rate: (item.rate || item.unit_price).toFixed(2),
        itemTotal: item.item_total.toFixed(2),
      })),
      subtotal: invoiceDetail.subtotal.toFixed(2),
      sgstRate: invoiceDetail.sgst_rate,
      sgstAmount: invoiceDetail.sgst_amount.toFixed(2),
      cgstRate: invoiceDetail.cgst_rate,
      cgstAmount: invoiceDetail.cgst_amount.toFixed(2),
      igstRate: invoiceDetail.igst_rate,
      igstAmount: invoiceDetail.igst_amount.toFixed(2),
      totalAmount: invoiceDetail.total_amount.toFixed(2),
      bankName: 'Kalai Industries',
      accountNumber: '42805276994',
      ifscCode: 'SBIN0070805',
      branchName: 'Mohan Nager',
      termsConditions: 'Payment will be due prior to provision or delivery of goods/services.',
      contactEmail: 'contact@kalaicocoproducts.com',
      contactPhone: '9025973435',
      contactWebsite: 'kalaicocoproducts.com',
      generatedDate: new Date().toLocaleDateString('en-IN'),
      generatedBy: req.user?.email || 'System',
    };

    // Render HTML
    const html = invoiceService.renderHtmlInvoice(templateData);

    // Generate PDF
    const pdfBuffer = await htmlToPdf(html);

    // Save PDF to database
    const logId = await invoiceService.saveInvoicePdf(
      Number(invoiceId),
      invoiceDetail.invoice_number,
      pdfBuffer,
      req.user?.userId || 0
    );

    logger.info(`Invoice PDF generated and saved: ${invoiceDetail.invoice_number}`);

    res.json({
      success: true,
      message: 'Invoice PDF generated and saved successfully',
      data: {
        logId,
        fileSize: pdfBuffer.length,
        invoiceNumber: invoiceDetail.invoice_number,
      },
    });
  } catch (error) {
    next(error);
  }
};
