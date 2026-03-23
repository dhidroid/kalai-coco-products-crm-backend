import { BaseRepository } from './BaseRepository';

export class InvoiceRepository extends BaseRepository {
  async getAll(limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await this.callFunction('fn_get_all_invoices', [limit, offset]);
    return result.rows.filter((r: any) => !r.is_deleted);
  }

  async getById(id: number): Promise<any | null> {
    const result = await this.callFunction('fn_get_invoice_with_items', [id]);
    return result.rows[0] || null;
  }

  async getItems(invoiceId: number): Promise<any[]> {
    const result = await this.callFunction('fn_get_invoice_items', [invoiceId]);
    return result.rows;
  }

  async create(data: {
    invoiceNumber: string;
    invoiceDate: Date;
    billToUserId: number;
    shipToUserId?: number;
    vehicleNumber?: string;
    dateOfSupply?: Date;
    sgstRate?: number;
    cgstRate?: number;
    igstRate?: number;
    createdBy: number;
  }): Promise<number> {
    const result = await this.callProcedure('sp_create_invoice', [
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
      null, // OUT p_invoice_id
      null, // OUT p_status
    ]);
    return Number(result.rows[0].p_invoice_id);
  }

  async addItem(data: {
    invoiceId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    rate?: number;
  }): Promise<number> {
    const result = await this.callProcedure('sp_add_invoice_item', [
      data.invoiceId,
      data.productId,
      data.quantity,
      data.unitPrice,
      data.rate || data.unitPrice,
      null, // OUT p_item_id
      null, // OUT p_status
    ]);
    return Number(result.rows[0].p_item_id);
  }

  async updateStatus(id: number, status: string): Promise<void> {
    const result = await this.callProcedure('sp_update_invoice_status', [id, status, null, null]);
    if (!result.rows[0].p_success) {
      throw new Error(result.rows[0].p_message);
    }
  }

  async softDelete(id: number): Promise<void> {
    await this.callProcedure('sp_delete_invoice', [id, null, null]);
  }

  async savePdf(data: {
    invoiceId: number;
    invoiceNumber: string;
    pdfBuffer: Buffer;
    fileSize: number;
    generatedBy: number;
  }): Promise<number> {
    const result = await this.callProcedure('sp_save_invoice_pdf', [
      data.invoiceId,
      data.invoiceNumber,
      data.pdfBuffer,
      data.fileSize,
      data.generatedBy,
      null, // OUT p_log_id
      null, // OUT p_status
    ]);
    return Number(result.rows[0].p_log_id);
  }

  async getPdf(invoiceId: number): Promise<any | null> {
    const result = await this.callFunction('fn_get_invoice_pdf', [invoiceId]);
    return result.rows[0] || null;
  }

  async getSummary(): Promise<any> {
    const result = await this.query(`
      SELECT 
        COUNT(invoice_id) as total_invoices,
        SUM(total_amount) as total_revenue,
        COUNT(CASE WHEN invoice_status = 'draft' THEN 1 END) as pending_invoices
      FROM invoice_headers
      WHERE is_deleted = FALSE
    `);
    return result.rows[0];
  }

  async getRecentInvoices(limit: number = 5): Promise<any[]> {
    const result = await this.query(`
      SELECT ih.invoice_id, ih.invoice_number, ih.total_amount, ih.invoice_status, ih.created_at,
             ud.first_name, ud.last_name
      FROM invoice_headers ih
      JOIN user_details ud ON ih.bill_to_user_id = ud.user_id
      WHERE ih.is_deleted = FALSE
      ORDER BY ih.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }
}
