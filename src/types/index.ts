import { Request } from 'express';

export interface User {
  id: number;
  user_id?: number; // alias for compatibility
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  gstin?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'Admin',
  SUPER_ADMIN = 'Super Admin',
  EMPLOYEE = 'Employee',
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface PriceLevel {
  id: number;
  name: string;
  price: number;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface Product {
  product_id: number;
  product_code: string;
  product_name: string;
  description?: string;
  hsn_code?: string;
  unit: string;
  price: number;
  tax_rate: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductInput {
  productCode: string;
  productName: string;
  description?: string;
  hsnCode?: string;
  unit?: string;
  price: number;
  taxRate?: number;
  isActive?: boolean;
}
