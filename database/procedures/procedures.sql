-- Procedure: public.sp_create_product(p_product_code character varying, p_product_name character varying, p_price numeric)
CREATE OR REPLACE PROCEDURE public.sp_create_product(
	IN p_product_code character varying,
	IN p_product_name character varying,
	IN p_price numeric)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    INSERT INTO products (product_code, product_name, price)
    VALUES (p_product_code, p_product_name, p_price);
END;
$BODY$;
ALTER PROCEDURE public.sp_create_product(IN p_product_code character varying, IN p_product_name character varying, IN p_price numeric)
    OWNER TO webdb_wwht_user;


-- Function: public.fn_get_all_products()   
CREATE OR REPLACE FUNCTION public.fn_get_all_products()
    RETURNS TABLE(product_id bigint, product_code character varying, product_name character varying, price numeric, created_at timestamp without time zone, updated_at timestamp without time zone) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
    SELECT
        product_id,
        product_code,
        product_name,
        price,
        created_at,
        updated_at
    FROM products
    ORDER BY created_at DESC;
$BODY$;

-- Function: public.fn_get_product_by_id(p_product_id bigint)
CREATE OR REPLACE FUNCTION public.fn_get_product_by_id(
	p_product_id bigint)
    RETURNS TABLE(product_id bigint, product_code character varying, product_name character varying, price numeric, created_at timestamp without time zone, updated_at timestamp without time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
    RETURN QUERY
    SELECT
        product_id,
        product_code,
        product_name,
        price,
        created_at,
        updated_at
    FROM products
    WHERE product_id = p_product_id;
END;
$BODY$;


CREATE OR REPLACE PROCEDURE public.sp_delete_product(
	IN p_product_id bigint)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    DELETE FROM products
    WHERE product_id = p_product_id;

    -- Optional safety check
    IF NOT FOUND THEN
        RAISE NOTICE 'Product with ID % not found.', p_product_id;
    END IF;
END;
$BODY$;


CREATE OR REPLACE PROCEDURE public.sp_register_user(
	IN p_role_id bigint,
	IN p_email character varying,
	IN p_password_hash text,
	IN p_first_name character varying,
	IN p_last_name character varying,
	IN p_dob date,
	IN p_phone character varying)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_user_id BIGINT;
BEGIN
    -- Insert into users
    INSERT INTO users (role_id, email, password_hash)
    VALUES (p_role_id, p_email, p_password_hash)
    RETURNING user_id INTO v_user_id;

    -- Insert into user_details
    INSERT INTO user_details (
        user_id, first_name, last_name, dob, phone
    )
    VALUES (
        v_user_id, p_first_name, p_last_name, p_dob, p_phone
    );
END;
$BODY$;

-- ============================================
-- LOGIN USER PROCEDURE
-- ============================================
CREATE OR REPLACE PROCEDURE public.sp_login_user(
    IN  p_email            VARCHAR,
    IN  p_password_hash    TEXT,
    OUT o_user_id          BIGINT,
    OUT o_role_id          BIGINT,
    OUT o_email            VARCHAR,
    OUT o_first_name       VARCHAR,
    OUT o_last_name        VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT
        u.user_id,
        u.role_id,
        u.email,
        ud.first_name,
        ud.last_name
    INTO
        o_user_id,
        o_role_id,
        o_email,
        o_first_name,
        o_last_name
    FROM users u
    JOIN user_details ud ON ud.user_id = u.user_id
    WHERE u.email = p_email
      AND u.password_hash = p_password_hash
      AND u.is_active = TRUE;

    -- Invalid credentials
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid email or password'
        USING ERRCODE = '28000'; -- invalid authorization
    END IF;
END;
$$;


CREATE OR REPLACE PROCEDURE public.sp_update_product(
	IN p_product_id bigint,
	IN p_product_code character varying,
	IN p_product_name character varying,
	IN p_price numeric)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    UPDATE products
    SET
        product_code = p_product_code,
        product_name = p_product_name,
        price = p_price
    WHERE product_id = p_product_id;
END;
$BODY$;

CREATE OR REPLACE PROCEDURE public.sp_update_user_profile(
	IN p_user_id bigint,
	IN p_first_name character varying,
	IN p_last_name character varying,
	IN p_dob date,
	IN p_phone character varying)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    UPDATE user_details
    SET
        first_name = p_first_name,
        last_name = p_last_name,
        dob = p_dob,
        phone = p_phone
    WHERE user_id = p_user_id;
END;
$BODY$;




-- ============================================
-- DELETE USER PROCEDURE
-- ============================================
CREATE OR REPLACE PROCEDURE public.sp_delete_user(
	IN p_user_id bigint,
	OUT p_status varchar,
	OUT p_message varchar)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    -- Delete from user_details first (foreign key dependency)
    DELETE FROM user_details WHERE user_id = p_user_id;
    
    -- Delete from users
    DELETE FROM users WHERE user_id = p_user_id;
    
    IF FOUND THEN
        p_status := 'success';
        p_message := 'User deleted successfully';
    ELSE
        p_status := 'error';
        p_message := 'User not found';
    END IF;
    
    EXCEPTION WHEN OTHERS THEN
        p_status := 'error';
        p_message := 'Error deleting user: ' || SQLERRM;
END;
$BODY$;

-- ============================================
-- GET USER BY ID FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_user_by_id(p_user_id bigint)
RETURNS TABLE(user_id bigint, email varchar, role_id bigint, role_name varchar, 
              first_name varchar, last_name varchar, dob date, phone varchar,
              is_active boolean, created_at timestamp)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.email,
        u.role_id,
        r.name,
        ud.first_name,
        ud.last_name,
        ud.dob,
        ud.phone,
        u.is_active,
        u.created_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN user_details ud ON u.user_id = ud.user_id
    WHERE u.user_id = p_user_id;
END;
$BODY$;

-- ============================================
-- GET ALL USERS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_all_users()
RETURNS TABLE(user_id bigint, email varchar, role_id bigint, role_name varchar,
              first_name varchar, last_name varchar, is_active boolean, created_at timestamp)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.email,
        u.role_id,
        r.name,
        ud.first_name,
        ud.last_name,
        u.is_active,
        u.created_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN user_details ud ON u.user_id = ud.user_id
    ORDER BY u.created_at DESC;
END;
$BODY$;

-- ============================================
-- GET USER BY EMAIL FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_get_user_by_email(p_email varchar)
RETURNS TABLE(user_id bigint, email varchar, password_hash text, role_id bigint, role_name varchar,
              first_name varchar, last_name varchar, is_active boolean, created_at timestamp)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.email,
        u.password_hash,
        u.role_id,
        r.name,
        ud.first_name,
        ud.last_name,
        u.is_active,
        u.created_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN user_details ud ON u.user_id = ud.user_id
    WHERE u.email = p_email;
END;
$BODY$;

-- ============================================
-- CHANGE USER ROLE PROCEDURE
-- ============================================
CREATE OR REPLACE PROCEDURE public.sp_change_user_role(
	IN p_user_id bigint,
	IN p_role_id bigint,
	OUT p_status varchar,
	OUT p_message varchar)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    UPDATE users 
    SET role_id = p_role_id, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    IF FOUND THEN
        p_status := 'success';
        p_message := 'User role updated successfully';
    ELSE
        p_status := 'error';
        p_message := 'User not found';
    END IF;
    
    EXCEPTION WHEN FOREIGN_KEY_VIOLATION THEN
        p_status := 'error';
        p_message := 'Invalid role';
    WHEN OTHERS THEN
        p_status := 'error';
        p_message := 'Error updating role: ' || SQLERRM;
END;
$BODY$;

CREATE OR REPLACE PROCEDURE sp_generate_invoice(
    p_invoice_number  VARCHAR,
    p_product_id      BIGINT,
    p_quantity        INTEGER,
    p_unit_price      NUMERIC(12,2),
    p_invoice_binary  BYTEA,
    p_generated_by    VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_amount NUMERIC(14,2);
BEGIN
    -- Calculate total
    v_total_amount := p_quantity * p_unit_price;

    -- Insert invoice log
    INSERT INTO invoice_logs (
        invoice_number,
        product_id,
        quantity,
        unit_price,
        total_amount,
        invoice_binary,
        generated_by
    )
    VALUES (
        p_invoice_number,
        p_product_id,
        p_quantity,
        p_unit_price,
        v_total_amount,
        p_invoice_binary,
        p_generated_by
    );
END;
$$;
