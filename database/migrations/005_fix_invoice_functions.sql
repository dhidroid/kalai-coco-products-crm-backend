-- Fixes for invoice functions to prevent GROUP BY errors and add missing columns
-- Updated at 2026-03-24

CREATE OR REPLACE FUNCTION fn_get_invoice_with_items(IN p_invoice_id BIGINT)
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
    ship_to_address TEXT,
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
        CONCAT(ud_bill.first_name, ' ', ud_bill.last_name)::VARCHAR as bill_to_name,
        u_bill.email::VARCHAR as bill_to_email,
        COALESCE(ud_bill.phone, '')::VARCHAR as bill_to_phone,
        COALESCE(ud_bill.gstin, '')::VARCHAR as bill_to_gstin,
        COALESCE(ud_bill.address, '')::TEXT as bill_to_address,
        COALESCE(ih.ship_to_name, CONCAT(ud_ship.first_name, ' ', ud_ship.last_name))::VARCHAR as ship_to_name,
        COALESCE(ih.ship_to_phone, ud_ship.phone, '')::VARCHAR as ship_to_phone,
        COALESCE(ih.ship_to_gstin, ud_ship.gstin, '')::VARCHAR as ship_to_gstin,
        COALESCE(ih.ship_to_address, ud_ship.address, '')::TEXT as ship_to_address,
        COALESCE(ih.vehicle_number, '')::VARCHAR as vehicle_number,
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
        (SELECT COUNT(*)::INTEGER FROM invoice_items ii WHERE ii.invoice_id = ih.invoice_id) as item_count
    FROM
        invoice_headers ih
        LEFT JOIN users u_bill ON ih.bill_to_user_id = u_bill.user_id
        LEFT JOIN user_details ud_bill ON u_bill.user_id = ud_bill.user_id
        LEFT JOIN users u_ship ON ih.ship_to_user_id = u_ship.user_id
        LEFT JOIN user_details ud_ship ON u_ship.user_id = ud_ship.user_id
    WHERE
        ih.invoice_id = p_invoice_id;
END;
$$;

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
        COALESCE(CONCAT(ud.first_name, ' ', ud.last_name), '')::VARCHAR,
        ih.total_amount,
        ih.invoice_status,
        (SELECT COUNT(*)::INTEGER FROM invoice_items ii WHERE ii.invoice_id = ih.invoice_id) as item_count,
        ih.created_at
    FROM
        invoice_headers ih
        LEFT JOIN users u ON ih.bill_to_user_id = u.user_id
        LEFT JOIN user_details ud ON u.user_id = ud.user_id
    ORDER BY ih.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
