import app from './app';
import { config } from '@config/environment';
import { logger } from '@utils/logger';
import { getPool } from '@config/database';
import { closeBrowser } from '@utils/pdf';
import { initializeDatabase } from '@config/init';

(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    logger.error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
})();

const server = app.listen(config.app.port, config.app.host, () => {
  logger.info(
    `Server running on http://${config.app.host}:${config.app.port} in ${config.app.nodeEnv} mode`
  );
  logger.info(`API Documentation: http://${config.app.host}:${config.app.port}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    const pool = getPool();
    await pool.end();
    await closeBrowser();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    const pool = getPool();
    await pool.end();
    await closeBrowser();
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: any) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

export default server;
