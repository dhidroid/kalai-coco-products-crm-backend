/**
 * Invoice Service - Business logic for invoice management
 */
import pkg from 'pg';
import { logger } from '../utils/logger';
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
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async createInvoice(data: InvoiceHeaderInput): Promise<number> {
    try {
      const query = `
        CALL sp_create_invoice(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
      `;

      const result = await pool.query(query, [
        data.invoiceNumber,
        data.invoiceDate,
        data.billToUserId,
        data.shipToUserId || null,
        data.vehicleNumber || null,
        data.dateOfSupply || null,
        data.sgstRate || 9.0,
        data.cgstRate || 9.0,
        data.igstRate || 0.0,
        data.createdBy,
      ]);

      logger.info(`Invoice ${data.invoiceNumber} created successfully`);
      return result.rows[0].p_invoice_id;
    } catch (error) {
      logger.error(`Error creating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Add item to invoice
   */
  async addInvoiceItem(invoiceId: number, item: InvoiceItemInput): Promise<number> {
    try {
      // Validate quantity and price
      if (item.quantity <= 0 || item.unitPrice < 0) {
        throw new ValidationError('Invalid quantity or unit price');
      }

      const query = `
        CALL sp_add_invoice_item(
          $1, $2, $3, $4, $5
        )
      `;

      const result = await pool.query(query, [
        invoiceId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.rate || item.unitPrice,
      ]);

      const itemId = result.rows[0].p_item_id;
      if (itemId === -1) {
        throw new ValidationError(result.rows[0].p_status || 'Failed to add invoice item');
      }

      logger.info(`Item added to invoice ${invoiceId}`);
      return itemId;
    } catch (error) {
      logger.error(`Error adding invoice item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get invoice with all details
   */
  async getInvoiceById(invoiceId: number): Promise<InvoiceDetail> {
    try {
      const query = `SELECT * FROM fn_get_invoice_with_items($1)`;
      const result = await pool.query(query, [invoiceId]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDetail> {
    try {
      const query = `SELECT * FROM fn_get_invoice_with_items(
        (SELECT invoice_id FROM invoice_headers WHERE invoice_number = $1)
      )`;
      const result = await pool.query(query, [invoiceNumber]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Invoice ${invoiceNumber} not found`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching invoice by number: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get invoice items
   */
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItemRow[]> {
    try {
      const query = `SELECT * FROM fn_get_invoice_items($1)`;
      const result = await pool.query(query, [invoiceId]);

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching invoice items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get all invoices with pagination
   */
  async getAllInvoices(limit: number = 10, offset: number = 0): Promise<InvoiceListItem[]> {
    try {
      const query = `SELECT * FROM fn_get_all_invoices($1, $2)`;
      const result = await pool.query(query, [limit, offset]);

      return result.rows;
    } catch (error) {
      logger.error(`Error fetching invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Save invoice PDF binary
   */
  async saveInvoicePdf(
    invoiceId: number,
    invoiceNumber: string,
    pdfBuffer: Buffer,
    generatedBy: number
  ): Promise<number> {
    try {
      const query = `
        CALL sp_save_invoice_pdf(
          $1, $2, $3, $4, $5
        )
      `;

      const result = await pool.query(query, [
        invoiceId,
        invoiceNumber,
        pdfBuffer,
        pdfBuffer.length,
        generatedBy,
      ]);

      logger.info(`Invoice PDF saved for invoice ${invoiceNumber}`);
      return result.rows[0].p_log_id;
    } catch (error) {
      logger.error(`Error saving invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePdf(invoiceId: number): Promise<InvoicePdf> {
    try {
      const query = `SELECT * FROM fn_get_invoice_pdf($1)`;
      const result = await pool.query(query, [invoiceId]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`PDF for invoice ${invoiceId} not found`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: number, status: string): Promise<boolean> {
    try {
      const validStatuses = ['draft', 'finalized', 'sent', 'paid', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status: ${status}`);
      }

      const query = `CALL sp_update_invoice_status($1, $2)`;
      const result = await pool.query(query, [invoiceId, status]);

      if (!result.rows[0].p_success) {
        throw new NotFoundError(result.rows[0].p_message);
      }

      logger.info(`Invoice ${invoiceId} status updated to ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error updating invoice status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId: number): Promise<boolean> {
    try {
      const query = `CALL sp_delete_invoice($1)`;
      const result = await pool.query(query, [invoiceId]);

      if (!result.rows[0].p_success) {
        throw new NotFoundError(result.rows[0].p_message);
      }

      logger.info(`Invoice ${invoiceId} deleted`);
      return true;
    } catch (error) {
      logger.error(`Error deleting invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Load HTML template
   */
  private loadHtmlTemplate(): string {
    try {
      const templatePath = path.join(__dirname, '../templates/invoice.html');
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      logger.error(`Error loading template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerError('Failed to load invoice template');
    }
  }

  /**
   * Render HTML from template with data
   */
  renderHtmlInvoice(data: HtmlTemplateData): string {
    let html = this.loadHtmlTemplate();

    // Replace all template variables with actual data
    const replaceVariable = (variable: string, value: any) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      html = html.replace(regex, value !== null && value !== undefined ? String(value) : '');
    };

    // Simple variable replacements
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'items') {
        // Handle items array separately
        const itemsHtml = this.renderItems(value);
        html = html.replace(/{{#items}}[\s\S]*?{{\/items}}/g, itemsHtml);
      } else {
        replaceVariable(key, value);
      }
    });

    return html;
  }

  /**
   * Render invoice items HTML
   */
  private renderItems(items: any[]): string {
    return items
      .map((item, index) => {
        return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${item.description}</td>
          <td class="text-center"><span class="hsn-code">${item.hsnCode}</span></td>
          <td class="text-right">${item.quantity} ${item.unit}</td>
          <td class="text-right amount">₹${parseFloat(item.unitPrice).toFixed(2)}</td>
          <td class="text-right amount">₹${parseFloat(item.rate).toFixed(2)}</td>
          <td class="text-right amount">₹${parseFloat(item.itemTotal).toFixed(2)}</td>
        </tr>
      `;
      })
      .join('');
  }

  /**
   * Generate unique invoice number
   */
  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${year}${month}-${randomNum}`;
  }
}

export const invoiceService = new InvoiceService();
