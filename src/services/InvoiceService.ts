import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { logger } from '../utils/logger';
import { productionService } from './ProductionService';
import {
  InvoiceHeaderInput,
  InvoiceItemInput,
  InvoiceDetail,
  InvoiceListItem,
  InvoicePdf,
  InvoiceItemRow,
  HtmlTemplateData,
} from '../types/invoice';
import { NotFoundError, ValidationError, InternalServerError } from '../utils/errors';
import * as fs from 'fs';
import * as path from 'path';
import { htmlToPdf } from '../utils/pdf';
import Mustache from 'mustache';
import { fileURLToPath } from 'url';

const currentFilename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilename);

export class InvoiceService {
  private invoiceRepository: InvoiceRepository;

  constructor() {
    this.invoiceRepository = new InvoiceRepository();
  }

  async createInvoice(data: InvoiceHeaderInput): Promise<number> {
    try {
      const invoiceId = await this.invoiceRepository.create(data);
      if (invoiceId === -1) {
        throw new ValidationError('Failed to create invoice (database constraint or missing user)');
      }
      logger.info(`Invoice ${data.invoiceNumber} created successfully`);
      return invoiceId;
    } catch (error) {
      logger.error(`Error creating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async addInvoiceItem(invoiceId: number, item: InvoiceItemInput): Promise<number> {
    if (item.quantity <= 0 || item.unitPrice < 0) {
      throw new ValidationError('Invalid quantity or unit price');
    }

    const itemId = await this.invoiceRepository.addItem({
      invoiceId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      rate: item.rate
    });

    if (itemId === -1) {
      throw new ValidationError('Failed to add invoice item');
    }

    return itemId;
  }

  async getInvoiceById(invoiceId: number): Promise<InvoiceDetail> {
    const invoice = await this.invoiceRepository.getById(invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }
    return invoice;
  }

  async getAllInvoices(limit: number = 10, offset: number = 0): Promise<InvoiceListItem[]> {
    return this.invoiceRepository.getAll(limit, offset);
  }

  async updateInvoiceStatus(invoiceId: number, status: string): Promise<void> {
    const validStatuses = ['draft', 'issued', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status: ${status}`);
    }
    await this.invoiceRepository.updateStatus(invoiceId, status);
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    await this.invoiceRepository.softDelete(invoiceId);
  }

  async generatePdfBuffer(invoiceId: number): Promise<{ pdfBuffer: Buffer, invoiceNumber: string }> {
    const invoice = await this.getInvoiceById(invoiceId);
    const items = await this.invoiceRepository.getItems(invoiceId);

    const templateData: HtmlTemplateData = {
      companyName: 'Kalai Coco Products',
      companyGstin: '33JZAPK2901Q1Z5',
      companyAddress: 'Ellayur, Muthuyaikanpatty omlur (TK), Salem, Tamil Nadu - 636304',
      companyPhone: '9025973435',
      companyEmail: 'admin@kalaicoco.com',
      companyWebsite: 'www.kalaicoco.com',
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.invoice_date).toLocaleDateString(),
      billToName: invoice.bill_to_name,
      billToPhone: invoice.bill_to_phone,
      billToGstin: invoice.bill_to_gstin,
      billToAddress: invoice.bill_to_address,
      shipToName: invoice.ship_to_name || '',
      shipToAddress: invoice.ship_to_address || '',
      shipToGstin: invoice.ship_to_gstin || '',
      shipToPhone: invoice.ship_to_phone || '',
      vehicleNumber: invoice.vehicle_number || '',
      dateOfSupply: invoice.date_of_supply ? new Date(invoice.date_of_supply).toLocaleDateString() : '',
      subtotal: Number(invoice.subtotal).toFixed(2),
      sgstRate: Number(invoice.sgst_rate),
      sgstAmount: Number(invoice.sgst_amount).toFixed(2),
      cgstRate: Number(invoice.cgst_rate),
      cgstAmount: Number(invoice.cgst_amount).toFixed(2),
      igstRate: Number(invoice.igst_rate),
      igstAmount: Number(invoice.igst_amount).toFixed(2),
      totalAmount: Number(invoice.total_amount).toFixed(2),
      bankName: 'Indian Bank',
      accountNumber: '1234567890',
      ifscCode: 'IDIB000O012',
      branchName: 'Omalur',
      termsConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% will be charged if payment is not made within due date.',
      contactEmail: 'admin@kalaicoco.com',
      contactPhone: '9025973435',
      contactWebsite: 'www.kalaicoco.com',
      generatedDate: new Date().toLocaleDateString(),
      generatedBy: 'System',
      items: items.map(item => ({
        description: item.description,
        hsnCode: item.hsn_code,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: Number(item.unit_price).toFixed(2),
        rate: Number(item.rate).toFixed(2),
        itemTotal: Number(item.item_total).toFixed(2)
      }))
    };


    const html = this.renderHtmlInvoice(templateData);
    const pdfBuffer = await htmlToPdf(html);

    return {
      pdfBuffer,
      invoiceNumber: invoice.invoice_number
    };
  }

  async getDashboardSummary(): Promise<any> {
    const summary = await this.invoiceRepository.getSummary();
    const recentInvoices = await this.invoiceRepository.getRecentInvoices();
    const recentProductions = await productionService.getAllProductions(5, 0);
    
    return {
      summary,
      recentInvoices,
      recentProductions
    };
  }

  private renderHtmlInvoice(data: HtmlTemplateData): string {
    const templatePath = path.join(currentDir, '../templates/invoice.html');
    const templateString = fs.readFileSync(templatePath, 'utf-8');

    // Make items 1-indexed for the template instead of 0-indexed, if template needs @index natively, but we can just supply index manually.
    const viewData = {
      ...data,
      items: data.items.map((item, i) => ({ ...item, index: i + 1 })),
      hasIgst: data.igstRate > 0
    };

    return Mustache.render(templateString, viewData);
  }

  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${year}${month}-${random}`;
  }
}

export const invoiceService = new InvoiceService();

