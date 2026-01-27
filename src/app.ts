import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';
import { config } from '@config/environment';
import { swaggerSpec } from '@docs/swagger';
import authRoutes from '@routes/authRoutes';
import userRoutes from '@routes/userRoutes';
import priceLevelRoutes from '@routes/priceLevelRoutes';
import { invoiceRoutes } from '@routes/invoiceRoutes';
import { errorHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Documentation
if (config.swagger.enabled) {
  app.use(config.swagger.path, swaggerUi.serve);
  app.get(config.swagger.path, swaggerUi.setup(swaggerSpec) as any);
  logger.info(`Swagger documentation available at ${config.swagger.path}`);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/price-levels', priceLevelRoutes);
app.use('/api/invoices', invoiceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
