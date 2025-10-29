import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import adminRoutes from './routes/admin';
import subscriptionRoutes from './routes/subscriptions';
import templateRoutes, { initializeTemplateRoutes } from './routes/templates';
import healthRoutes from './routes/health';
import { logger } from './utils/logger';
import { metricsCollector } from './utils/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Custom logging middleware
app.use(logger.requestLogger());

// Metrics collection middleware
app.use(metricsCollector.collectRequestMetrics());

// Morgan logging for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware (simple implementation)
app.use((req, res, next) => {
  const cookies: Record<string, string> = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Extend Express Request interface for cookies
declare global {
  namespace Express {
    interface Request {
      cookies: Record<string, string>;
    }
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/templates', templateRoutes);

// Health and monitoring routes
app.use('/', healthRoutes);

// Error logging middleware
app.use(logger.errorLogger());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    const db = await connectDatabase();
    logger.info('Database connected successfully');
    
    // Initialize template routes with database connection
    initializeTemplateRoutes(db);

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Metrics enabled: ${process.env.ENABLE_METRICS === 'true'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Starting graceful shutdown...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
};

startServer();

export default app;