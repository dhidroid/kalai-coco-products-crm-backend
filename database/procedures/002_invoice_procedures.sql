-- ============================================
-- INVOICE STORED PROCEDURES
-- ============================================

-- ============================================
-- CREATE INVOICE PROCEDURE
-- ============================================
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
    WHEN FOREIGN_KEY_VIOLATION THEN
        p_status := 'error: invalid user reference';
        p_invoice_id := -1;
    WHEN OTHERS THEN
        p_status := 'error: ' || SQLERRM;
        p_invoice_id := -1;
END;
$$;

-- ============================================
-- ADD INVOICE ITEM PROCEDURE
-- ============================================
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
    -- Get product details
    SELECT product_name, hsn_code, unit
    INTO v_description, v_hsn_code, v_unit
    FROM products WHERE product_id = p_product_id;

    IF v_description IS NULL THEN
        p_status := 'error: product not found';
        p_item_id := -1;
        RETURN;
    END IF;

    -- Calculate item total
    v_item_total := p_quantity * p_unit_price;

    -- Insert invoice item
    INSERT INTO invoice_items (
        invoice_id, product_id, description, hsn_code,
        quantity, unit, unit_price, rate, item_total
    )
    VALUES (
        p_invoice_id, p_product_id, v_description, v_hsn_code,
        p_quantity, v_unit, p_unit_price, p_rate, v_item_total
    )
    RETURNING item_id INTO p_item_id;

    p_status := 'success';

    EXCEPTION WHEN FOREIGN_KEY_VIOLATION THEN
        p_status := 'error: invalid invoice or product';
        p_item_id := -1;
    WHEN OTHERS THEN
        p_status := 'error: ' || SQLERRM;
        p_item_id := -1;
END;
$$;

-- ============================================
-- GET INVOICE WITH ITEMS
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_invoice_with_items(
    IN p_invoice_id BIGINT
)
RETURNS TABLE (
    invoice_id BIGINT,
    invoice_number VARCHAR,
    invoice_date TIMESTAMP,
    bill_to_name VARCHAR,
    bill_to_email VARCHAR,
    bill_to_phone VARCHAR,
    bill_to_gstin VARCHAR,
    bill_to_address TEXT,
    ship_to_name VARCHAR,
    ship_to_phone VARCHAR,
    ship_to_gstin VARCHAR,
    vehicle_number VARCHAR,
    date_of_supply TIMESTAMP,
    subtotal NUMERIC,
    sgst_rate NUMERIC,
    sgst_amount NUMERIC,
    cgst_rate NUMERIC,
    cgst_amount NUMERIC,
    igst_rate NUMERIC,
    igst_amount NUMERIC,
    total_amount NUMERIC,
    invoice_status VARCHAR,
    item_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ih.invoice_id,
        ih.invoice_number,
        ih.invoice_date,
        CONCAT(ud_bill.first_name, ' ', ud_bill.last_name),
        u_bill.email,
        ud_bill.phone,
        ud_bill.gstin,
        ud_bill.address,
        CONCAT(ud_ship.first_name, ' ', ud_ship.last_name),
        ud_ship.phone,
        ud_ship.gstin,
        ih.vehicle_number,
        ih.date_of_supply,
        ih.subtotal,
        ih.sgst_rate,
        ih.sgst_amount,
        ih.cgst_rate,
        ih.cgst_amount,
        ih.igst_rate,
        ih.igst_amount,
        ih.total_amount,
        ih.invoice_status,
        COUNT(ii.item_id)::INTEGER
    FROM
        invoice_headers ih
        LEFT JOIN users u_bill ON ih.bill_to_user_id = u_bill.user_id
        LEFT JOIN user_details ud_bill ON u_bill.user_id = ud_bill.user_id
        LEFT JOIN users u_ship ON ih.ship_to_user_id = u_ship.user_id
        LEFT JOIN user_details ud_ship ON u_ship.user_id = ud_ship.user_id
        LEFT JOIN invoice_items ii ON ih.invoice_id = ii.invoice_id
    WHERE
        ih.invoice_id = p_invoice_id
    GROUP BY
        ih.invoice_id, ud_bill.first_name, ud_bill.last_name, u_bill.email,
        ud_bill.phone, ud_bill.gstin, ud_bill.address,
        ud_ship.first_name, ud_ship.last_name, ud_ship.phone, ud_ship.gstin;
END;
$$;

-- ============================================
-- GET INVOICE ITEMS
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_invoice_items(
    IN p_invoice_id BIGINT
)
RETURNS TABLE (
    item_id BIGINT,
    product_id BIGINT,
    description VARCHAR,
    hsn_code VARCHAR,
    quantity NUMERIC,
    unit VARCHAR,
    unit_price NUMERIC,
    rate NUMERIC,
    item_total NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ii.item_id,
        ii.product_id,
        ii.description,
        ii.hsn_code,
        ii.quantity,
        ii.unit,
        ii.unit_price,
        ii.rate,
        ii.item_total
    FROM invoice_items ii
    WHERE ii.invoice_id = p_invoice_id
    ORDER BY ii.item_id;
END;
$$;

-- ============================================
-- GET ALL INVOICES WITH PAGINATION
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_all_invoices(
    IN p_limit INTEGER DEFAULT 10,
    IN p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    invoice_id BIGINT,
    invoice_number VARCHAR,
    invoice_date TIMESTAMP,
    bill_to_name VARCHAR,
    total_amount NUMERIC,
    invoice_status VARCHAR,
    item_count INTEGER,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ih.invoice_id,
        ih.invoice_number,
        ih.invoice_date,
        CONCAT(ud.first_name, ' ', ud.last_name),
        ih.total_amount,
        ih.invoice_status,
        COUNT(ii.item_id)::INTEGER,
        ih.created_at
    FROM
        invoice_headers ih
        LEFT JOIN users u ON ih.bill_to_user_id = u.user_id
        LEFT JOIN user_details ud ON u.user_id = ud.user_id
        LEFT JOIN invoice_items ii ON ih.invoice_id = ii.invoice_id
    GROUP BY ih.invoice_id, ud.first_name, ud.last_name
    ORDER BY ih.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================
-- SAVE INVOICE PDF PROCEDURE
-- ============================================
CREATE OR REPLACE PROCEDURE sp_save_invoice_pdf(
    IN p_invoice_id BIGINT,
    IN p_invoice_number VARCHAR,
    IN p_invoice_binary BYTEA,
    IN p_file_size BIGINT,
    IN p_generated_by BIGINT,
    OUT p_log_id BIGINT,
    OUT p_status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO invoice_logs (
        invoice_id, invoice_number, invoice_binary,
        file_size, mime_type, generated_by
    )
    VALUES (
        p_invoice_id, p_invoice_number, p_invoice_binary,
        p_file_size, 'application/pdf', p_generated_by
    )
    RETURNING log_id INTO p_log_id;

    -- Update invoice status to finalized
    UPDATE invoice_headers
    SET invoice_status = 'finalized'
    WHERE invoice_id = p_invoice_id;

    p_status := 'success';

    EXCEPTION WHEN OTHERS THEN
        p_status := 'error: ' || SQLERRM;
        p_log_id := -1;
END;
$$;

-- ============================================
-- RETRIEVE INVOICE PDF PROCEDURE
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_invoice_pdf(
    IN p_invoice_id BIGINT
)
RETURNS TABLE (
    log_id BIGINT,
    invoice_number VARCHAR,
    invoice_binary BYTEA,
    file_size BIGINT,
    mime_type VARCHAR,
    generated_at TIMESTAMP,
    generated_by_name VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        il.log_id,
        il.invoice_number,
        il.invoice_binary,
        il.file_size,
        il.mime_type,
        il.generated_at,
        CONCAT(ud.first_name, ' ', ud.last_name)
    FROM
        invoice_logs il
        LEFT JOIN users u ON il.generated_by = u.user_id
        LEFT JOIN user_details ud ON u.user_id = ud.user_id
    WHERE
        il.invoice_id = p_invoice_id
    ORDER BY il.generated_at DESC
    LIMIT 1;
END;
$$;

-- ============================================
-- UPDATE INVOICE STATUS PROCEDURE
-- ============================================
CREATE OR REPLACE PROCEDURE sp_update_invoice_status(
    IN p_invoice_id BIGINT,
    IN p_status VARCHAR,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invoice_headers
    SET invoice_status = p_status
    WHERE invoice_id = p_invoice_id;

    IF FOUND THEN
        p_success := TRUE;
        p_message := 'Invoice status updated successfully';
    ELSE
        p_success := FALSE;
        p_message := 'Invoice not found';
    END IF;

    EXCEPTION WHEN OTHERS THEN
        p_success := FALSE;
        p_message := SQLERRM;
END;
$$;

-- ============================================
-- DELETE INVOICE PROCEDURE
-- ============================================
CREATE OR REPLACE PROCEDURE sp_delete_invoice(
    IN p_invoice_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete associated items (cascades via FK)
    DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;

    -- Delete associated logs
    DELETE FROM invoice_logs WHERE invoice_id = p_invoice_id;

    -- Delete invoice header
    DELETE FROM invoice_headers WHERE invoice_id = p_invoice_id;

    IF FOUND THEN
        p_success := TRUE;
        p_message := 'Invoice deleted successfully';
    ELSE
        p_success := FALSE;
        p_message := 'Invoice not found';
    END IF;

    EXCEPTION WHEN OTHERS THEN
        p_success := FALSE;
        p_message := SQLERRM;
END;
$$;

-- ============================================
-- GET INVOICE BY NUMBER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_invoice_by_number(
    IN p_invoice_number VARCHAR
)
RETURNS TABLE (
    invoice_id BIGINT,
    invoice_number VARCHAR,
    invoice_date TIMESTAMP,
    total_amount NUMERIC,
    invoice_status VARCHAR,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ih.invoice_id,
        ih.invoice_number,
        ih.invoice_date,
        ih.total_amount,
        ih.invoice_status,
        ih.created_at
    FROM invoice_headers ih
    WHERE ih.invoice_number = p_invoice_number;
END;
$$;
