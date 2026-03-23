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
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('Skipping database migration as per SKIP_MIGRATIONS env var');
    return;
  }
  const client = await pool.connect();

  try {
    const sqlFile = path.join(__dirname, '../../database/run-migration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    console.log('Running database migration...');

    await client.query(sql);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
