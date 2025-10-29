import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRoutes from './routes/health-demo';
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Demo routes for testing
app.get('/api/demo', (req, res) => {
  logger.info('Demo endpoint accessed');
  res.json({ 
    message: 'Demo API endpoint working!',
    timestamp: new Date().toISOString(),
    monitoring: 'enabled'
  });
});

app.get('/api/demo/error', (req, res) => {
  logger.error('Demo error endpoint accessed');
  res.status(500).json({ error: 'Demo error for testing monitoring' });
});

app.get('/api/demo/slow', (req, res) => {
  logger.info('Demo slow endpoint accessed');
  // Simulate slow response
  setTimeout(() => {
    res.json({ message: 'Slow response for testing metrics' });
  }, 2000);
});

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

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Demo server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Metrics enabled: ${process.env.ENABLE_METRICS === 'true'}`);
  logger.info('Available endpoints:');
  logger.info('  - GET /health - Health check');
  logger.info('  - GET /metrics - Application metrics');
  logger.info('  - GET /metrics/prometheus - Prometheus metrics');
  logger.info('  - GET /api/demo - Demo endpoint');
  logger.info('  - GET /api/demo/error - Demo error endpoint');
  logger.info('  - GET /api/demo/slow - Demo slow endpoint');
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

export default app;