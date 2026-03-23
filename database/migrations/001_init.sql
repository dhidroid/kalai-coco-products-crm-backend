-- ============================================
-- DATABASE SCHEMA - Main Migration
-- ============================================

-- Sequences
CREATE SEQUENCE IF NOT EXISTS roles_role_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS users_user_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS user_details_user_detail_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS products_product_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_headers_invoice_id_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS invoice_items_item_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_logs_log_id_seq START 1;

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    role_id BIGINT NOT NULL DEFAULT nextval('roles_role_id_seq'),
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (role_id),
    CONSTRAINT roles_name_key UNIQUE (name)
);

-- Users Table
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

-- User Details Table
CREATE TABLE IF NOT EXISTS public.user_details (
    user_detail_id BIGINT NOT NULL DEFAULT nextval('user_details_user_detail_id_seq'),
    user_id BIGINT NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dob DATE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_details_pkey PRIMARY KEY (user_detail_id),
    CONSTRAINT fk_user_details_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Products Table
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

-- Invoice Headers Table
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

-- Invoice Items Table
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

-- Insert default roles
INSERT INTO roles (name) VALUES ('Admin'), ('Super Admin'), ('Employee')
ON CONFLICT (name) DO NOTHING;
