-- ============================================
-- INVOICE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================

-- Create sequences for auto-increment
CREATE SEQUENCE IF NOT EXISTS roles_role_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS users_user_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS user_details_user_detail_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS products_product_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_headers_invoice_id_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS invoice_items_item_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_logs_log_id_seq START 1;

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.roles (
    role_id BIGINT NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
    name VARCHAR(50) COLLATE pg_catalog."default" NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (role_id),
    CONSTRAINT roles_name_key UNIQUE (name)
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    user_id BIGINT NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
    role_id BIGINT NOT NULL,
    email VARCHAR(100) COLLATE pg_catalog."default" NOT NULL,
    password_hash TEXT COLLATE pg_catalog."default" NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ============================================
-- USER DETAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_details (
    user_detail_id BIGINT NOT NULL DEFAULT nextval('user_details_user_detail_id_seq'::regclass),
    user_id BIGINT NOT NULL,
    first_name VARCHAR(50) COLLATE pg_catalog."default",
    last_name VARCHAR(50) COLLATE pg_catalog."default",
    dob DATE,
    phone VARCHAR(20) COLLATE pg_catalog."default",
    company_name VARCHAR(100),
    gstin VARCHAR(15),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_details_pkey PRIMARY KEY (user_detail_id),
    CONSTRAINT fk_user_details_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    product_id BIGINT NOT NULL DEFAULT nextval('products_product_id_seq'::regclass),
    product_code VARCHAR(50) COLLATE pg_catalog."default" UNIQUE NOT NULL,
    product_name VARCHAR(150) COLLATE pg_catalog."default" NOT NULL,
    description TEXT,
    hsn_code VARCHAR(10),
    unit VARCHAR(20) DEFAULT 'KG',
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    tax_rate NUMERIC(5,2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_pkey PRIMARY KEY (product_id)
);

-- ============================================
-- INVOICE HEADERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_headers (
    invoice_id BIGINT NOT NULL DEFAULT nextval('invoice_headers_invoice_id_seq'::regclass),
    invoice_number VARCHAR(50) COLLATE pg_catalog."default" UNIQUE NOT NULL,
    invoice_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    due_date TIMESTAMP WITHOUT TIME ZONE,
    bill_to_user_id BIGINT NOT NULL,
    ship_to_user_id BIGINT,
    vehicle_number VARCHAR(30),
    date_of_supply TIMESTAMP WITHOUT TIME ZONE,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) DEFAULT 9.00,
    sgst_amount NUMERIC(14,2) DEFAULT 0.00,
    cgst_rate NUMERIC(5,2) DEFAULT 9.00,
    cgst_amount NUMERIC(14,2) DEFAULT 0.00,
    igst_rate NUMERIC(5,2) DEFAULT 0.00,
    igst_amount NUMERIC(14,2) DEFAULT 0.00,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    invoice_status VARCHAR(20) DEFAULT 'draft',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_headers_pkey PRIMARY KEY (invoice_id),
    CONSTRAINT fk_invoice_bill_to FOREIGN KEY (bill_to_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_invoice_ship_to FOREIGN KEY (ship_to_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    item_id BIGINT NOT NULL DEFAULT nextval('invoice_items_item_id_seq'::regclass),
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    description VARCHAR(150),
    hsn_code VARCHAR(10),
    quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    rate NUMERIC(12,2),
    item_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_items_pkey PRIMARY KEY (item_id),
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_headers(invoice_id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ============================================
-- INVOICE BINARY LOG TABLE (for storing PDFs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_logs (
    log_id BIGINT NOT NULL DEFAULT nextval('invoice_logs_log_id_seq'::regclass),
    invoice_id BIGINT NOT NULL,
    invoice_number VARCHAR(50) COLLATE pg_catalog."default" NOT NULL,
    invoice_binary BYTEA NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(50) DEFAULT 'application/pdf',
    generated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by BIGINT,
    CONSTRAINT invoice_logs_pkey PRIMARY KEY (log_id),
    CONSTRAINT fk_invoice_logs_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_headers(invoice_id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_logs_user FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_details_user_id ON user_details(user_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_number ON invoice_headers(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_status ON invoice_headers(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_created_by ON invoice_headers(created_by);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_invoice_date ON invoice_headers(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_invoice_id ON invoice_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_generated_at ON invoice_logs(generated_at);

-- ============================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_details
DROP TRIGGER IF EXISTS trigger_user_details_updated_at ON user_details;
CREATE TRIGGER trigger_user_details_updated_at
BEFORE UPDATE ON user_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to products
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to invoice_headers
DROP TRIGGER IF EXISTS trigger_invoice_headers_updated_at ON invoice_headers;
CREATE TRIGGER trigger_invoice_headers_updated_at
BEFORE UPDATE ON invoice_headers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INVOICE CALCULATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal NUMERIC(14,2);
    v_sgst_amount NUMERIC(14,2);
    v_cgst_amount NUMERIC(14,2);
    v_igst_amount NUMERIC(14,2);
    v_total NUMERIC(14,2);
    v_sgst_rate NUMERIC(5,2);
    v_cgst_rate NUMERIC(5,2);
    v_igst_rate NUMERIC(5,2);
BEGIN
    -- Get invoice rates
    SELECT sgst_rate, cgst_rate, igst_rate INTO v_sgst_rate, v_cgst_rate, v_igst_rate
    FROM invoice_headers WHERE invoice_id = NEW.invoice_id;

    -- Calculate subtotal
    SELECT COALESCE(SUM(item_total), 0) INTO v_subtotal
    FROM invoice_items WHERE invoice_id = NEW.invoice_id;

    -- Calculate taxes
    v_sgst_amount := (v_subtotal * v_sgst_rate) / 100;
    v_cgst_amount := (v_subtotal * v_cgst_rate) / 100;
    v_igst_amount := (v_subtotal * v_igst_rate) / 100;
    v_total := v_subtotal + v_sgst_amount + v_cgst_amount + v_igst_amount;

    -- Update invoice header with calculated totals
    UPDATE invoice_headers
    SET
        subtotal = v_subtotal,
        sgst_amount = v_sgst_amount,
        cgst_amount = v_cgst_amount,
        igst_amount = v_igst_amount,
        total_amount = v_total
    WHERE invoice_id = NEW.invoice_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to invoice_items
DROP TRIGGER IF EXISTS trigger_invoice_items_calculate ON invoice_items;
CREATE TRIGGER trigger_invoice_items_calculate
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_totals();

-- ============================================
-- SAMPLE DATA
-- ============================================
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('user'), ('guest')
ON CONFLICT (name) DO NOTHING;
