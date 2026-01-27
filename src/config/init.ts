/**
 * Database initialization - ensures roles exist
 */
import { query } from './database.js';
import { logger } from '../utils/logger.js';

export async function initializeDatabase(): Promise<void> {
  try {
    // Check if roles already exist
    const result = await query('SELECT COUNT(*) as count FROM roles');
    const roleCount = result.rows[0].count;

    if (roleCount === 0) {
      // Insert default roles only if table is empty
      await query(`
        INSERT INTO roles (name) VALUES 
        ('Admin'), ('Super Admin'), ('Employee')
      `);
      logger.info('Database initialized with default roles: Admin, Super Admin, Employee');
    } else {
      logger.info('Database roles already exist');
    }
  } catch (error) {
    logger.error(`Database initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
