/**
 * Database initialization - ensures roles exist
 */
import { query } from './database.js';
import { logger } from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase(): Promise<void> {
  try {
    // 1. Check if tables exist
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      logger.warn('Database tables not found! Running default migration...');
      const sqlFile = path.resolve(__dirname, '../../database/run-migration.sql');
      if (fs.existsSync(sqlFile)) {
        const sql = fs.readFileSync(sqlFile, 'utf-8');
        await query(sql);
        logger.info('Default migration executed successfully');
      } else {
        logger.error(`Migration file not found at ${sqlFile}`);
        return;
      }
    }

    // 2. Check for soft delete column (003_soft_delete migration)
    const softDeleteCheck = await query(`
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_deleted'
    `);
    
    if (parseInt(softDeleteCheck.rows[0].count) === 0) {
      logger.info('Applying soft delete migration (003_soft_delete)...');
      const softDeleteFile = path.resolve(__dirname, '../../database/migrations/003_soft_delete.sql');
      if (fs.existsSync(softDeleteFile)) {
        const sql = fs.readFileSync(softDeleteFile, 'utf-8');
        await query(sql);
        logger.info('Soft delete migration applied');
      }
    }

    // 3. Check for invoice function fixes (005_fix_invoice_functions migration)
    const functionCheck = await query(`
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'fn_get_invoice_with_items' AND column_name = 'ship_to_address'
    `);
    
    if (parseInt(functionCheck.rows[0].count) === 0) {
      logger.info('Applying invoice function fixes (005_fix_invoice_functions)...');
      const fixFile = path.resolve(__dirname, '../../database/migrations/005_fix_invoice_functions.sql');
      if (fs.existsSync(fixFile)) {
        const sql = fs.readFileSync(fixFile, 'utf-8');
        await query(sql);
        logger.info('Invoice function fixes applied');
      }
    }

    // 4. Ensure default roles exist (idempotent)
    await query(`
      INSERT INTO roles (name) 
      VALUES ('Admin'), ('Super Admin'), ('Employee')
      ON CONFLICT DO NOTHING
    `);
    
    logger.info('Database initialization check completed');
  } catch (error) {
    logger.error(
      `Database initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
