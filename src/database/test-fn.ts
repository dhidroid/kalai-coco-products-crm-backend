import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  const res = await pool.query('SELECT * FROM fn_get_all_invoices(10, 0)');
  console.log('Result:', JSON.stringify(res.rows, null, 2));
  await pool.end();
}

test().catch(console.error);
