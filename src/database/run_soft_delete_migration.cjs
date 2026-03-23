const pkg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
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
