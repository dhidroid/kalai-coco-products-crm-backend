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
        CONCAT(ud_bill.first_name, ' ', ud_bill.last_name),
        u_bill.email, COALESCE(ud_bill.phone, ''),
        COALESCE(ud_bill.gstin, ''), COALESCE(ud_bill.address, ''),
        CONCAT(COALESCE(ud_ship.first_name, ''), ' ', COALESCE(ud_ship.last_name, '')),
        COALESCE(ud_ship.phone, ''), COALESCE(ud_ship.gstin, ''),
        COALESCE(ih.vehicle_number, ''), ih.date_of_supply,
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
        COALESCE(CONCAT(ud.first_name, ' ', ud.last_name), '')
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
