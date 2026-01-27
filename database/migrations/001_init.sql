-- create role table 
CREATE TABLE IF NOT EXISTS public.roles
(
    role_id bigint NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
    name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (role_id)
)

--- create user table
CREATE TABLE IF NOT EXISTS public.users
(
    user_id bigint NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
    role_id bigint NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email)
)

-- create user details table
CREATE TABLE IF NOT EXISTS public.user_details
(
    user_detail_id bigint NOT NULL DEFAULT nextval('user_details_user_detail_id_seq'::regclass),
    user_id bigint NOT NULL,
    first_name character varying(50) COLLATE pg_catalog."default",
    last_name character varying(50) COLLATE pg_catalog."default",
    dob date,
    phone character varying(20) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_details_pkey PRIMARY KEY (user_detail_id)
)


-- create table for invoice log
CREATE TABLE invoice_logs (
    invoice_id        BIGSERIAL PRIMARY KEY,
    invoice_number    VARCHAR(50) UNIQUE NOT NULL,
    product_id        BIGINT NOT NULL,
    quantity          INTEGER NOT NULL CHECK (quantity > 0),
    unit_price        NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_amount      NUMERIC(14,2) NOT NULL,
    invoice_binary    BYTEA NOT NULL,  -- PDF / binary invoice
    generated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by      VARCHAR(100),

    CONSTRAINT fk_invoice_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);
