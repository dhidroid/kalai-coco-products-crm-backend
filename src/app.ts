import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';
import { config } from '@config/environment';
import { swaggerSpec } from '@docs/swagger';
import authRoutes from '@routes/authRoutes';
import userRoutes from '@routes/userRoutes';
import priceLevelRoutes from '@routes/priceLevelRoutes';
import { invoiceRoutes } from '@routes/invoiceRoutes';
import { productRoutes } from '@routes/productRoutes';
import { errorHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendViews = path.join(rootDir, 'frontend/views');
const frontendPublic = path.join(rootDir, 'frontend/public');

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

// Serve frontend static files (before API routes)
app.use(express.static(frontendPublic));

// Frontend routes - serve HTML pages
app.get('/login', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendViews, 'login.html'));
});

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendViews, 'dashboard.html'));
});

app.get('/dashboard', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendViews, 'dashboard.html'));
});

app.get('/invoices', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendViews, 'invoices.html'));
});

app.get('/products', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendViews, 'products.html'));
});

app.get('/customers', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendViews, 'customers.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/price-levels', priceLevelRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/products', productRoutes);

// Serve frontend for non-API routes (catch-all)
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  }
  if (!req.path.includes('.')) {
    // Unknown page — fall back to dashboard
    res.sendFile(path.join(frontendViews, 'dashboard.html'));
  } else {
    res.status(404).json({ success: false, message: 'Not found' });
  }
});

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
