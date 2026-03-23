import { z } from 'zod';
import { UserRole } from '../types/index';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.nativeEnum(UserRole).optional(),
    phone: z.string().optional(),
    dob: z.string().optional(),
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    phone: z.string().optional(),
    gstin: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  })
});

export const createProductSchema = z.object({
  body: z.object({
    productCode: z.string().min(1),
    productName: z.string().min(1),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    unit: z.string().optional(),
    price: z.number().positive(),
    taxRate: z.number().optional().default(18.0),
    isActive: z.boolean().optional().default(true),
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    productCode: z.string().optional(),
    productName: z.string().optional(),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    unit: z.string().optional(),
    price: z.number().positive().optional(),
    taxRate: z.number().optional(),
    isActive: z.boolean().optional(),
  })
});

export const createInvoiceSchema = z.object({
  body: z.object({
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().datetime().optional(),
    billToUserId: z.number(),
    shipToUserId: z.number().optional(),
    vehicleNumber: z.string().optional(),
    dateOfSupply: z.string().datetime().optional(),
    sgstRate: z.number().optional(),
    cgstRate: z.number().optional(),
    igstRate: z.number().optional(),
    shipToName: z.string().optional(),
    shipToAddress: z.string().optional(),
    shipToGstin: z.string().optional(),
    shipToPhone: z.string().optional(),
  })
});

export const addInvoiceItemSchema = z.object({
  body: z.object({
    productId: z.number(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    rate: z.number().optional(),
  })
});
