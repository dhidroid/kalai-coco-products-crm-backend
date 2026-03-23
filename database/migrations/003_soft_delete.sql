-- Soft Delete Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE invoice_headers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create Indexes for Soft Delete
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_is_deleted ON invoice_headers(is_deleted);

-- Update sp_delete_user to soft delete
CREATE OR REPLACE PROCEDURE public.sp_delete_user(
	IN p_user_id bigint,
	OUT p_status varchar,
	OUT p_message varchar)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    UPDATE users SET is_deleted = TRUE, is_active = FALSE WHERE user_id = p_user_id;
    
    IF FOUND THEN
        p_status := 'success';
        p_message := 'User soft-deleted successfully';
    ELSE
        p_status := 'error';
        p_message := 'User not found';
    END IF;
    
    EXCEPTION WHEN OTHERS THEN
        p_status := 'error';
        p_message := 'Error deleting user: ' || SQLERRM;
END;
$BODY$;

-- Update sp_delete_product to soft delete
CREATE OR REPLACE PROCEDURE public.sp_delete_product(
	IN p_product_id bigint)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    UPDATE products SET is_deleted = TRUE, is_active = FALSE WHERE product_id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Product with ID % not found.', p_product_id;
    END IF;
END;
$BODY$;

-- Update sp_delete_invoice to soft delete
CREATE OR REPLACE PROCEDURE sp_delete_invoice(IN p_invoice_id BIGINT, OUT p_success BOOLEAN, OUT p_message VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invoice_headers SET is_deleted = TRUE WHERE invoice_id = p_invoice_id;
    IF FOUND THEN p_success := TRUE; p_message := 'Invoice soft-deleted successfully';
    ELSE p_success := FALSE; p_message := 'Invoice not found';
    END IF;
EXCEPTION WHEN OTHERS THEN p_success := FALSE; p_message := SQLERRM;
END;
$$;
