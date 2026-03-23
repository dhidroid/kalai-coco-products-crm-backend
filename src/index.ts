import app from './app';
import { config } from '@config/environment';
import { logger } from '@utils/logger';
import { getPool } from '@config/database';
import { closeBrowser } from '@utils/pdf';
// import { initializeDatabase } from '@config/init';

let server: any;

async function startServer() {
  try {
    if (config.database_migrate.skip) {
      logger.info('Database initialization skipped via configuration');
    } else {
      // await initializeDatabase();
    }
    
    server = app.listen(config.app.port, config.app.host, () => {
      logger.info(
        `Server running on http://${config.app.host}:${config.app.port} in ${config.app.nodeEnv} mode`
      );
      logger.info(`API Documentation: http://${config.app.host}:${config.app.port}/api-docs`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        try {
          // Close browser first
          await closeBrowser();
          // Then close database pool
          const pool = getPool();
          await pool.end();
          logger.info('Server closed and resources released');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

startServer();

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
