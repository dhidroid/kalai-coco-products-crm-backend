-- Seed Data for Kalai Coco Products CRM
-- Admin password: password123 (hashed)
-- Customer passwords: password123 (hashed)

-- 1. Insert Users & User Details
-- Passwords are 'password123'
WITH admin_user AS (
    INSERT INTO users (role_id, email, password_hash, is_active)
    VALUES (1, 'admin@kalaicoco.com', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
    RETURNING user_id
)
INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, gstin, address, city, state, pincode)
SELECT user_id, 'Kalai', 'Admin', '9025973435', 'Kalai Coco Products', '33JZAPK2901Q1Z5', 'Ellayur, Muthuyaikanpatty omlur (TK)', 'Salem', 'Tamil Nadu', '636304'
FROM admin_user;

WITH emp_user AS (
    INSERT INTO users (role_id, email, password_hash, is_active)
    VALUES (3, 'employee@kalaicoco.com', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
    RETURNING user_id
)
INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, city, state)
SELECT user_id, 'Saravanan', 'P', '9876543210', 'Kalai Coco Products', 'Salem', 'Tamil Nadu'
FROM emp_user;

-- Customers
WITH cust1 AS (
    INSERT INTO users (role_id, email, password_hash, is_active)
    VALUES (3, 'info@moderntraders.com', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
    RETURNING user_id
)
INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, gstin, address, city, state, pincode)
SELECT user_id, 'Rajesh', 'Kumar', '9988776655', 'Modern Traders Pvt Ltd', '33AAAAA0000A1Z5', '123 Market Street', 'Coimbatore', 'Tamil Nadu', '641001'
FROM cust1;

WITH cust2 AS (
    INSERT INTO users (role_id, email, password_hash, is_active)
    VALUES (3, 'contact@salemcoco.in', '$2a$10$llJSJ2rHAMTe/az.FXk/JuTK/qsLBTbjsO/OAOTfskJTyxzyCKzES', true)
    RETURNING user_id
)
INSERT INTO user_details (user_id, first_name, last_name, phone, company_name, gstin, address, city, state, pincode)
SELECT user_id, 'Senthil', 'Nathan', '8877665544', 'Salem Coco Exporters', '33BBBBB1111B1Z5', '45 Industrial Estate', 'Salem', 'Tamil Nadu', '636005'
FROM cust2;

-- 2. Insert Products
INSERT INTO products (product_code, product_name, description, hsn_code, unit, price, tax_rate)
VALUES 
('CF-001', 'Coco Fiber (50kg Bale)', 'High quality brown coco fiber for mattress and brush industry.', '5305', 'BDL', 1200.00, 18.0),
('CP-005', 'Coco Peat (5kg Block)', 'Low EC washed coco peat for horticulture and gardening.', '1404', 'PCS', 85.00, 12.0),
('CR-010', 'Curled Coir Rope', 'Natural curled coir rope for upholstery and filter manufacture.', '5308', 'KG', 45.00, 18.0),
('CC-Buffered', 'Coco Chips (Buffered)', 'Calcium buffered coco chips for superior root growth.', '1404', 'KG', 65.00, 12.0);

-- 3. Insert Productions
INSERT INTO productions (product_id, batch_number, quantity, unit, production_date, notes, created_by)
SELECT product_id, 'B-2024-084-01', 500, unit, CURRENT_DATE, 'Quality check passed. Moisture level optimal.', (SELECT user_id FROM users WHERE email = 'admin@kalaicoco.com')
FROM products WHERE product_code = 'CF-001';

INSERT INTO productions (product_id, batch_number, quantity, unit, production_date, notes, created_by)
SELECT product_id, 'B-2024-083-45', 2000, unit, CURRENT_DATE - INTERVAL '1 day', 'Standard batch.', (SELECT user_id FROM users WHERE email = 'admin@kalaicoco.com')
FROM products WHERE product_code = 'CP-005';

-- 4. Insert Invoices (Headers)
INSERT INTO invoice_headers (invoice_number, invoice_date, bill_to_user_id, ship_to_user_id, vehicle_number, date_of_supply, subtotal, sgst_amount, cgst_amount, total_amount, invoice_status, created_by)
VALUES 
('INV-2403-1001', CURRENT_TIMESTAMP - INTERVAL '2 days', 
  (SELECT user_id FROM users WHERE email = 'info@moderntraders.com'),
  (SELECT user_id FROM users WHERE email = 'info@moderntraders.com'),
  'TN-30-AX-1234', CURRENT_TIMESTAMP - INTERVAL '2 days',
  12000.00, 1080.00, 1080.00, 14160.00, 'paid',
  (SELECT user_id FROM users WHERE email = 'admin@kalaicoco.com')
),
('INV-2403-1002', CURRENT_TIMESTAMP, 
  (SELECT user_id FROM users WHERE email = 'contact@salemcoco.in'),
  (SELECT user_id FROM users WHERE email = 'contact@salemcoco.in'),
  'TN-54-BB-9988', CURRENT_TIMESTAMP,
  4250.00, 255.00, 255.00, 4760.00, 'draft',
  (SELECT user_id FROM users WHERE email = 'admin@kalaicoco.com')
);

-- 5. Insert Invoice Items
INSERT INTO invoice_items (invoice_id, product_id, description, hsn_code, quantity, unit, unit_price, rate, item_total)
SELECT 
  (SELECT invoice_id FROM invoice_headers WHERE invoice_number = 'INV-2403-1001'),
  product_id, product_name, hsn_code, 10, unit, price, price, (price * 10)
FROM products WHERE product_code = 'CF-001';

INSERT INTO invoice_items (invoice_id, product_id, description, hsn_code, quantity, unit, unit_price, rate, item_total)
SELECT 
  (SELECT invoice_id FROM invoice_headers WHERE invoice_number = 'INV-2403-1002'),
  product_id, product_name, hsn_code, 50, unit, price, price, (price * 50)
FROM products WHERE product_code = 'CP-005';
