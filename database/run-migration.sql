-- ============================================
-- COMPLETE DATABASE MIGRATION
-- Run this entire file in PostgreSQL
-- ============================================

-- 1. Create Sequences
CREATE SEQUENCE IF NOT EXISTS roles_role_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS users_user_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS user_details_user_detail_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS products_product_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_headers_invoice_id_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS invoice_items_item_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_logs_log_id_seq START 1;

-- 2. Create Tables
-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
    role_id BIGINT NOT NULL DEFAULT nextval('roles_role_id_seq'),
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (role_id),
    CONSTRAINT roles_name_key UNIQUE (name)
);

-- Users
CREATE TABLE IF NOT EXISTS public.users (
    user_id BIGINT NOT NULL DEFAULT nextval('users_user_id_seq'),
    role_id BIGINT NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- User Details
CREATE TABLE IF NOT EXISTS public.user_details (
    user_detail_id BIGINT NOT NULL DEFAULT nextval('user_details_user_detail_id_seq'),
    user_id BIGINT NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dob DATE,
    phone VARCHAR(20),
    company_name VARCHAR(100),
    gstin VARCHAR(15),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_details_pkey PRIMARY KEY (user_detail_id),
    CONSTRAINT fk_user_details_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    product_id BIGINT NOT NULL DEFAULT nextval('products_product_id_seq'),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    description TEXT,
    hsn_code VARCHAR(10),
    unit VARCHAR(20) DEFAULT 'KG',
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    tax_rate NUMERIC(5,2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_pkey PRIMARY KEY (product_id)
);

-- Invoice Headers
CREATE TABLE IF NOT EXISTS public.invoice_headers (
    invoice_id BIGINT NOT NULL DEFAULT nextval('invoice_headers_invoice_id_seq'),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP,
    bill_to_user_id BIGINT NOT NULL,
    ship_to_user_id BIGINT,
    vehicle_number VARCHAR(30),
    date_of_supply TIMESTAMP,
    subtotal NUMERIC(14,2) DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) DEFAULT 9.00,
    sgst_amount NUMERIC(14,2) DEFAULT 0.00,
    cgst_rate NUMERIC(5,2) DEFAULT 9.00,
    cgst_amount NUMERIC(14,2) DEFAULT 0.00,
    igst_rate NUMERIC(5,2) DEFAULT 0.00,
    igst_amount NUMERIC(14,2) DEFAULT 0.00,
    total_amount NUMERIC(14,2) DEFAULT 0.00,
    notes TEXT,
    invoice_status VARCHAR(20) DEFAULT 'draft',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_headers_pkey PRIMARY KEY (invoice_id),
    CONSTRAINT fk_invoice_bill_to FOREIGN KEY (bill_to_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_invoice_ship_to FOREIGN KEY (ship_to_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    item_id BIGINT NOT NULL DEFAULT nextval('invoice_items_item_id_seq'),
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    description VARCHAR(150),
    hsn_code VARCHAR(10),
    quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    rate NUMERIC(12,2),
    item_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_items_pkey PRIMARY KEY (item_id),
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_headers(invoice_id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Invoice Logs (PDF Storage)
CREATE TABLE IF NOT EXISTS public.invoice_logs (
    log_id BIGINT NOT NULL DEFAULT nextval('invoice_logs_log_id_seq'),
    invoice_id BIGINT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_binary BYTEA NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(50) DEFAULT 'application/pdf',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by BIGINT,
    CONSTRAINT invoice_logs_pkey PRIMARY KEY (log_id),
    CONSTRAINT fk_invoice_logs_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_headers(invoice_id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_logs_user FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- 3. Insert Default Roles
INSERT INTO roles (name) VALUES ('Admin'), ('Super Admin'), ('Employee')
ON CONFLICT (name) DO NOTHING;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_details_user_id ON user_details(user_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_number ON invoice_headers(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_status ON invoice_headers(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Create Invoice
CREATE OR REPLACE PROCEDURE sp_create_invoice(
    IN p_invoice_number VARCHAR,
    IN p_invoice_date TIMESTAMP,
    IN p_bill_to_user_id BIGINT,
    IN p_ship_to_user_id BIGINT,
    IN p_vehicle_number VARCHAR,
    IN p_date_of_supply TIMESTAMP,
    IN p_sgst_rate NUMERIC,
    IN p_cgst_rate NUMERIC,
    IN p_igst_rate NUMERIC,
    IN p_created_by BIGINT,
    OUT p_invoice_id BIGINT,
    OUT p_status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO invoice_headers (
        invoice_number, invoice_date, bill_to_user_id, ship_to_user_id,
        vehicle_number, date_of_supply, sgst_rate, cgst_rate, igst_rate,
        created_by, invoice_status
    )
    VALUES (
        p_invoice_number, p_invoice_date, p_bill_to_user_id, p_ship_to_user_id,
        p_vehicle_number, p_date_of_supply, p_sgst_rate, p_cgst_rate, p_igst_rate,
        p_created_by, 'draft'
    )
    RETURNING invoice_id INTO p_invoice_id;
    p_status := 'success';
EXCEPTION WHEN UNIQUE_VIOLATION THEN
    p_status := 'error: invoice number already exists';
    p_invoice_id := -1;
WHEN OTHERS THEN
    p_status := 'error: ' || SQLERRM;
    p_invoice_id := -1;
END;
$$;

-- Add Invoice Item
CREATE OR REPLACE PROCEDURE sp_add_invoice_item(
    IN p_invoice_id BIGINT,
    IN p_product_id BIGINT,
    IN p_quantity NUMERIC,
    IN p_unit_price NUMERIC,
    IN p_rate NUMERIC,
    OUT p_item_id BIGINT,
    OUT p_status VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_description VARCHAR(150);
    v_hsn_code VARCHAR(10);
    v_unit VARCHAR(20);
    v_item_total NUMERIC(14,2);
BEGIN
    SELECT product_name, hsn_code, unit INTO v_description, v_hsn_code, v_unit
    FROM products WHERE product_id = p_product_id;

    IF v_description IS NULL THEN
        p_status := 'error: product not found';
        p_item_id := -1;
        RETURN;
    END IF;

    v_item_total := p_quantity * p_unit_price;

    INSERT INTO invoice_items (invoice_id, product_id, description, hsn_code, quantity, unit, unit_price, rate, item_total)
    VALUES (p_invoice_id, p_product_id, v_description, v_hsn_code, p_quantity, v_unit, p_unit_price, p_rate, v_item_total)
    RETURNING item_id INTO p_item_id;
    p_status := 'success';
EXCEPTION WHEN OTHERS THEN
    p_status := 'error: ' || SQLERRM;
    p_item_id := -1;
END;
$$;

-- Get Invoice With Items
CREATE OR REPLACE FUNCTION fn_get_invoice_with_items(IN p_invoice_id BIGINT)
RETURNS TABLE (
    invoice_id BIGINT, invoice_number VARCHAR, invoice_date TIMESTAMP,
    bill_to_name VARCHAR, bill_to_email VARCHAR, bill_to_phone VARCHAR,
    bill_to_gstin VARCHAR, bill_to_address TEXT, ship_to_name VARCHAR,
    ship_to_phone VARCHAR, ship_to_gstin VARCHAR, vehicle_number VARCHAR,
    date_of_supply TIMESTAMP, subtotal NUMERIC, sgst_rate NUMERIC,
    sgst_amount NUMERIC, cgst_rate NUMERIC, cgst_amount NUMERIC,
    igst_rate NUMERIC, igst_amount NUMERIC, total_amount NUMERIC,
    invoice_status VARCHAR, item_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ih.invoice_id, ih.invoice_number, ih.invoice_date,
        CONCAT(ud_bill.first_name, ' ', ud_bill.last_name)::VARCHAR,
        u_bill.email::VARCHAR, COALESCE(ud_bill.phone, '')::VARCHAR,
        COALESCE(ud_bill.gstin, '')::VARCHAR, COALESCE(ud_bill.address, '')::TEXT,
        CONCAT(COALESCE(ud_ship.first_name, ''), ' ', COALESCE(ud_ship.last_name, ''))::VARCHAR,
        COALESCE(ud_ship.phone, '')::VARCHAR, COALESCE(ud_ship.gstin, '')::VARCHAR,
        COALESCE(ih.vehicle_number, '')::VARCHAR, ih.date_of_supply,
        ih.subtotal, ih.sgst_rate, ih.sgst_amount, ih.cgst_rate, ih.cgst_amount,
        ih.igst_rate, ih.igst_amount, ih.total_amount, ih.invoice_status,
        COUNT(ii.item_id)::INTEGER
    FROM invoice_headers ih
    LEFT JOIN users u_bill ON ih.bill_to_user_id = u_bill.user_id
    LEFT JOIN user_details ud_bill ON u_bill.user_id = ud_bill.user_id
    LEFT JOIN users u_ship ON ih.ship_to_user_id = u_ship.user_id
    LEFT JOIN user_details ud_ship ON u_ship.user_id = ud_ship.user_id
    LEFT JOIN invoice_items ii ON ih.invoice_id = ii.invoice_id
    WHERE ih.invoice_id = p_invoice_id
    GROUP BY ih.invoice_id, ud_bill.first_name, ud_bill.last_name, u_bill.email,
        ud_bill.phone, ud_bill.gstin, ud_bill.address,
        ud_ship.first_name, ud_ship.last_name, ud_ship.phone, ud_ship.gstin;
END;
$$;

-- Get Invoice Items
CREATE OR REPLACE FUNCTION fn_get_invoice_items(IN p_invoice_id BIGINT)
RETURNS TABLE (
    item_id BIGINT, product_id BIGINT, description VARCHAR, hsn_code VARCHAR,
    quantity NUMERIC, unit VARCHAR, unit_price NUMERIC, rate NUMERIC, item_total NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT ii.item_id, ii.product_id, ii.description, ii.hsn_code,
        ii.quantity, ii.unit, ii.unit_price, ii.rate, ii.item_total
    FROM invoice_items ii WHERE ii.invoice_id = p_invoice_id ORDER BY ii.item_id;
END;
$$;

-- Get All Invoices
CREATE OR REPLACE FUNCTION fn_get_all_invoices(IN p_limit INTEGER DEFAULT 10, IN p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    invoice_id BIGINT, invoice_number VARCHAR, invoice_date TIMESTAMP,
    bill_to_name VARCHAR, total_amount NUMERIC, invoice_status VARCHAR,
    item_count INTEGER, created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT ih.invoice_id, ih.invoice_number, ih.invoice_date,
        COALESCE(CONCAT(ud.first_name, ' ', ud.last_name), '')::VARCHAR,
        ih.total_amount, ih.invoice_status, COUNT(ii.item_id)::INTEGER, ih.created_at
    FROM invoice_headers ih
    LEFT JOIN users u ON ih.bill_to_user_id = u.user_id
    LEFT JOIN user_details ud ON u.user_id = ud.user_id
    LEFT JOIN invoice_items ii ON ih.invoice_id = ii.invoice_id
    GROUP BY ih.invoice_id, ud.first_name, ud.last_name
    ORDER BY ih.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Save Invoice PDF
CREATE OR REPLACE PROCEDURE sp_save_invoice_pdf(
    IN p_invoice_id BIGINT, IN p_invoice_number VARCHAR, IN p_invoice_binary BYTEA,
    IN p_file_size BIGINT, IN p_generated_by BIGINT, OUT p_log_id BIGINT, OUT p_status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO invoice_logs (invoice_id, invoice_number, invoice_binary, file_size, mime_type, generated_by)
    VALUES (p_invoice_id, p_invoice_number, p_invoice_binary, p_file_size, 'application/pdf', p_generated_by)
    RETURNING log_id INTO p_log_id;
    UPDATE invoice_headers SET invoice_status = 'finalized' WHERE invoice_id = p_invoice_id;
    p_status := 'success';
EXCEPTION WHEN OTHERS THEN
    p_status := 'error: ' || SQLERRM; p_log_id := -1;
END;
$$;

-- Get Invoice PDF
CREATE OR REPLACE FUNCTION fn_get_invoice_pdf(IN p_invoice_id BIGINT)
RETURNS TABLE (log_id BIGINT, invoice_number VARCHAR, invoice_binary BYTEA, file_size BIGINT, mime_type VARCHAR, generated_at TIMESTAMP, generated_by_name VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT il.log_id, il.invoice_number, il.invoice_binary, il.file_size, il.mime_type, il.generated_at,
        COALESCE(CONCAT(ud.first_name, ' ', ud.last_name), '')::VARCHAR
    FROM invoice_logs il
    LEFT JOIN users u ON il.generated_by = u.user_id
    LEFT JOIN user_details ud ON u.user_id = ud.user_id
    WHERE il.invoice_id = p_invoice_id ORDER BY il.generated_at DESC LIMIT 1;
END;
$$;

-- Update Invoice Status
CREATE OR REPLACE PROCEDURE sp_update_invoice_status(IN p_invoice_id BIGINT, IN p_status VARCHAR, OUT p_success BOOLEAN, OUT p_message VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invoice_headers SET invoice_status = p_status WHERE invoice_id = p_invoice_id;
    IF FOUND THEN p_success := TRUE; p_message := 'Invoice status updated successfully';
    ELSE p_success := FALSE; p_message := 'Invoice not found';
    END IF;
EXCEPTION WHEN OTHERS THEN p_success := FALSE; p_message := SQLERRM;
END;
$$;

-- Delete Invoice
CREATE OR REPLACE PROCEDURE sp_delete_invoice(IN p_invoice_id BIGINT, OUT p_success BOOLEAN, OUT p_message VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;
    DELETE FROM invoice_logs WHERE invoice_id = p_invoice_id;
    DELETE FROM invoice_headers WHERE invoice_id = p_invoice_id;
    IF FOUND THEN p_success := TRUE; p_message := 'Invoice deleted successfully';
    ELSE p_success := FALSE; p_message := 'Invoice not found';
    END IF;
EXCEPTION WHEN OTHERS THEN p_success := FALSE; p_message := SQLERRM;
END;
$$;

-- Get Invoice By Number
CREATE OR REPLACE FUNCTION fn_get_invoice_by_number(IN p_invoice_number VARCHAR)
RETURNS TABLE (invoice_id BIGINT, invoice_number VARCHAR, invoice_date TIMESTAMP, total_amount NUMERIC, invoice_status VARCHAR, created_at TIMESTAMP)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT ih.invoice_id, ih.invoice_number, ih.invoice_date, ih.total_amount, ih.invoice_status, ih.created_at
    FROM invoice_headers ih WHERE ih.invoice_number = p_invoice_number;
END;
$$;
-- Migration for Productions module
CREATE TABLE IF NOT EXISTS productions (
  production_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  batch_number VARCHAR(50) NOT NULL,
  quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL, -- KG, PCS, etc.
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_productions_product ON productions(product_id);
CREATE INDEX IF NOT EXISTS idx_productions_date ON productions(production_date);

-- Procedure to log production
CREATE OR REPLACE PROCEDURE sp_log_production(
  p_product_id INTEGER,
  p_batch_number VARCHAR,
  p_quantity DECIMAL,
  p_unit VARCHAR,
  p_production_date DATE,
  p_notes TEXT,
  p_created_by INTEGER,
  OUT p_production_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO productions (
    product_id,
    batch_number,
    quantity,
    unit,
    production_date,
    notes,
    created_by
  ) VALUES (
    p_product_id,
    p_batch_number,
    p_quantity,
    p_unit,
    p_production_date,
    p_notes,
    p_created_by
  ) RETURNING production_id INTO p_production_id;
END;
$$;
-- Seed Data for Kalai Coco Products CRM
-- Admin password: password123 (hashed)
-- Customer passwords: password123 (hashed)

-- 1. Insert Users & User Details
-- Passwords are 'password123'
-- Admin
-- INSERT INTO users (role_id, email, password_hash, is_active)
-- VALUES (1, 'admin@kalaicoco.com', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, gstin, address, city, state, pincode)
-- SELECT user_id, 'Kalai', 'Admin', '9025973435', 'Kalai Coco Products', '33JZAPK2901Q1Z5', 'Ellayur, Muthuyaikanpatty omlur (TK)', 'Salem', 'Tamil Nadu', '636304'
-- FROM users WHERE email = 'admin@kalaicoco.com'
-- AND NOT EXISTS (SELECT 1 FROM user_details ud WHERE ud.user_id = users.user_id);

-- -- Employee
-- INSERT INTO users (role_id, email, password_hash, is_active)
-- VALUES (3, 'employee@kalaicoco.com', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, city, state)
-- SELECT user_id, 'Saravanan', 'P', '9876543210', 'Kalai Coco Products', 'Salem', 'Tamil Nadu'
-- FROM users WHERE email = 'employee@kalaicoco.com'
-- AND NOT EXISTS (SELECT 1 FROM user_details ud WHERE ud.user_id = users.user_id);

-- -- Customers
-- INSERT INTO users (role_id, email, password_hash, is_active)
-- VALUES (3, 'info@moderntraders.com', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, gstin, address, city, state, pincode)
-- SELECT user_id, 'Rajesh', 'Kumar', '9988776655', 'Modern Traders Pvt Ltd', '33AAAAA0000A1Z5', '123 Market Street', 'Coimbatore', 'Tamil Nadu', '641001'
-- FROM users WHERE email = 'info@moderntraders.com'
-- AND NOT EXISTS (SELECT 1 FROM user_details ud WHERE ud.user_id = users.user_id);

-- INSERT INTO users (role_id, email, password_hash, is_active)
-- VALUES (3, 'contact@salemcoco.in', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, gstin, address, city, state, pincode)
-- SELECT user_id, 'Senthil', 'Nathan', '8877665544', 'Salem Coco Exporters', '33BBBBB1111B1Z5', '45 Industrial Estate', 'Salem', 'Tamil Nadu', '636005'
-- FROM users WHERE email = 'contact@salemcoco.in'
-- AND NOT EXISTS (SELECT 1 FROM user_details ud WHERE ud.user_id = users.user_id);

-- -- 2. Insert Products
-- INSERT INTO products (product_code, product_name, description, hsn_code, unit, price, tax_rate)
-- VALUES 
-- ('CF-001', 'Coco Fiber (50kg Bale)', 'High quality brown coco fiber for mattress and brush industry.', '5305', 'BDL', 1200.00, 18.0),
-- ('CP-005', 'Coco Peat (5kg Block)', 'Low EC washed coco peat for horticulture and gardening.', '1404', 'PCS', 85.00, 12.0),
-- ('CR-010', 'Curled Coir Rope', 'Natural curled coir rope for upholstery and filter manufacture.', '5308', 'KG', 45.00, 18.0),
-- ('CC-Buffered', 'Coco Chips (Buffered)', 'Calcium buffered coco chips for superior root growth.', '1404', 'KG', 65.00, 12.0)
-- ON CONFLICT (product_code) DO NOTHING;

-- -- 3. Insert Productions
-- -- Only insert if productions table is empty for these products to avoid duplicate runs
-- INSERT INTO productions (product_id, batch_number, quantity, unit, production_date, notes, created_by)
-- SELECT p.product_id, 'B-2024-084-01', 500, p.unit, CURRENT_DATE, 'Quality check passed. Moisture level optimal.', u.user_id
-- FROM products p, users u
-- WHERE p.product_code = 'CF-001' AND u.email = 'admin@kalaicoco.com'
-- AND NOT EXISTS (SELECT 1 FROM productions pr WHERE pr.batch_number = 'B-2024-084-01');

-- INSERT INTO productions (product_id, batch_number, quantity, unit, production_date, notes, created_by)
-- SELECT p.product_id, 'B-2024-083-45', 2000, p.unit, CURRENT_DATE - INTERVAL '1 day', 'Standard batch.', u.user_id
-- FROM products p, users u
-- WHERE p.product_code = 'CP-005' AND u.email = 'admin@kalaicoco.com'
-- AND NOT EXISTS (SELECT 1 FROM productions pr WHERE pr.batch_number = 'B-2024-083-45');

-- -- 4. Insert Invoices (Headers)
-- -- Only insert if invoice headers are empty to avoid duplicates
-- INSERT INTO invoice_headers (invoice_number, invoice_date, bill_to_user_id, ship_to_user_id, vehicle_number, date_of_supply, subtotal, sgst_amount, cgst_amount, total_amount, invoice_status, created_by)
-- SELECT 'INV-2403-1001', CURRENT_TIMESTAMP - INTERVAL '2 days', u_bill.user_id, u_bill.user_id, 'TN-30-AX-1234', CURRENT_TIMESTAMP - INTERVAL '2 days', 12000.00, 1080.00, 1080.00, 14160.00, 'paid', u_admin.user_id
-- FROM users u_bill, users u_admin
-- WHERE u_bill.email = 'info@moderntraders.com' AND u_admin.email = 'admin@kalaicoco.com'
-- AND NOT EXISTS (SELECT 1 FROM invoice_headers WHERE invoice_number = 'INV-2403-1001');

-- INSERT INTO invoice_headers (invoice_number, invoice_date, bill_to_user_id, ship_to_user_id, vehicle_number, date_of_supply, subtotal, sgst_amount, cgst_amount, total_amount, invoice_status, created_by)
-- SELECT 'INV-2403-1002', CURRENT_TIMESTAMP, u_bill.user_id, u_bill.user_id, 'TN-54-BB-9988', CURRENT_TIMESTAMP, 4250.00, 255.00, 255.00, 4760.00, 'draft', u_admin.user_id
-- FROM users u_bill, users u_admin
-- WHERE u_bill.email = 'contact@salemcoco.in' AND u_admin.email = 'admin@kalaicoco.com'
-- AND NOT EXISTS (SELECT 1 FROM invoice_headers WHERE invoice_number = 'INV-2403-1002');

-- -- 5. Insert Invoice Items
-- INSERT INTO invoice_items (invoice_id, product_id, description, hsn_code, quantity, unit, unit_price, rate, item_total)
-- SELECT ih.invoice_id, p.product_id, p.product_name, p.hsn_code, 10, p.unit, p.price, p.price, (p.price * 10)
-- FROM invoice_headers ih, products p
-- WHERE ih.invoice_number = 'INV-2403-1001' AND p.product_code = 'CF-001'
-- AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = ih.invoice_id AND ii.product_id = p.product_id);

-- INSERT INTO invoice_items (invoice_id, product_id, description, hsn_code, quantity, unit, unit_price, rate, item_total)
-- SELECT ih.invoice_id, p.product_id, p.product_name, p.hsn_code, 50, p.unit, p.price, p.price, (p.price * 50)
-- FROM invoice_headers ih, products p
-- WHERE ih.invoice_number = 'INV-2403-1002' AND p.product_code = 'CP-005'
-- AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = ih.invoice_id AND ii.product_id = p.product_id);
