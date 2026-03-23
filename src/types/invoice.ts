/**
 * Invoice-related type definitions
 */

export interface InvoiceItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  rate?: number;
}

export interface InvoiceItemRow {
  item_id: number;
  product_id: number;
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  rate: number;
  item_total: number;
}

export interface InvoiceHeaderInput {
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
}

export interface InvoiceHeaderRow {
  invoice_id: number;
  invoice_number: string;
  invoice_date: Date;
  bill_to_user_id: number;
  ship_to_user_id?: number;
  vehicle_number?: string;
  date_of_supply?: Date;
  subtotal: number;
  sgst_rate: number;
  sgst_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
  invoice_status: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceDetail {
  invoice_id: number;
  invoice_number: string;
  invoice_date: Date;
  bill_to_name: string;
  bill_to_email: string;
  bill_to_phone: string;
  bill_to_gstin: string;
  bill_to_address: string;
  ship_to_name: string;
  ship_to_phone: string;
  ship_to_gstin: string;
  vehicle_number?: string;
  date_of_supply?: Date;
  subtotal: number;
  sgst_rate: number;
  sgst_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
  invoice_status: string;
  item_count: number;
}

export interface InvoicePdf {
  log_id: number;
  invoice_number: string;
  invoice_binary: Buffer;
  file_size: number;
  mime_type: string;
  generated_at: Date;
  generated_by_name: string;
}

export interface InvoiceListItem {
  invoice_id: any;
  invoice_number: any;
  invoice_date: any;
  bill_to_name: any;
  total_amount: any;
  invoice_status: any;
  item_count: any;
  created_at: any;
}

export interface InvoiceResponse {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: Date;
  billTo: {
    name: string;
    email: string;
    phone: string;
    gstin: string;
    address: string;
  };
  shipTo?: {
    name: string;
    phone: string;
    gstin: string;
  };
  vehicleNumber?: string;
  dateOfSupply?: Date;
  items: InvoiceItemRow[];
  subtotal: number;
  tax: {
    sgst: { rate: number; amount: number };
    cgst: { rate: number; amount: number };
    igst: { rate: number; amount: number };
  };
  totalAmount: number;
  status: string;
}

export interface HtmlTemplateData {
  companyName: string;
  companyGstin: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  invoiceNumber: string;
  invoiceDate: string;
  billToName: string;
  billToAddress: string;
  billToGstin: string;
  billToPhone: string;
  shipToName: string;
  shipToAddress: string;
  shipToGstin: string;
  vehicleNumber?: string;
  dateOfSupply?: string;
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    rate: string;
    itemTotal: string;
  }>;
  subtotal: string;
  sgstRate: number;
  sgstAmount: string;
  cgstRate: number;
  cgstAmount: string;
  igstRate?: number;
  igstAmount?: string;
  totalAmount: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  termsConditions: string;
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
  generatedDate: string;
  generatedBy: string;
}
