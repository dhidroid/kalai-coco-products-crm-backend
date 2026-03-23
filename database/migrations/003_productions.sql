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
