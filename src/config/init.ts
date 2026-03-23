/**
 * Database initialization - ensures roles exist
 */
import { query } from './database.js';
import { logger } from '../utils/logger.js';

export async function initializeDatabase(): Promise<void> {
  try {
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      logger.warn('========================================');
      logger.warn('Database tables not found!');
      logger.warn('Please run the migration SQL first:');
      logger.warn('  psql -U postgres -d your_database -f database/run-migration.sql');
      logger.warn('========================================');
      return;
    }

    const result = await query('SELECT COUNT(*) as count FROM roles');
    const roleCount = Number(result.rows[0].count);

    if (roleCount === 0) {
      await query(`INSERT INTO roles (name) VALUES ('Admin'), ('Super Admin'), ('Employee')`);
      logger.info('Database initialized with default roles');
    }
  } catch (error) {
    logger.warn(
      `Database check skipped: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
