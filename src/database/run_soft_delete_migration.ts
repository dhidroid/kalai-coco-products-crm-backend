import pkg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For render.com
  },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sqlFile = path.join(__dirname, '../../database/migrations/003_soft_delete.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log('Running soft delete migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
