import * as express from 'express';
import { metricsCollector } from '../utils/metrics';
import { logger } from '../utils/logger';

const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usage: NodeJS.MemoryUsage;
      percentage: number;
    };
  };
}

// Health check endpoint (demo version without real database)
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'up',
          responseTime: 5 // Mock database response time
        },
        memory: {
          status: 'ok',
          usage: process.memoryUsage(),
          percentage: 0
        }
      }
    };

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    healthStatus.checks.memory = {
      status: memoryPercentage > 90 ? 'critical' : memoryPercentage > 70 ? 'warning' : 'ok',
      usage: memoryUsage,
      percentage: memoryPercentage
    };

    if (healthStatus.checks.memory.status === 'critical') {
      healthStatus.status = 'unhealthy';
    }

    // Log health check
    const responseTime = Date.now() - startTime;
    logger.debug('Health check completed', {
      status: healthStatus.status,
      responseTime: `${responseTime}ms`,
      dbStatus: healthStatus.checks.database.status,
      memoryStatus: healthStatus.checks.memory.status
    });

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness check (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Mock readiness check
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    if (process.env.ENABLE_METRICS === 'true') {
      const metrics = metricsCollector.getMetrics();
      res.json(metrics);
    } else {
      res.status(404).json({ error: 'Metrics disabled' });
    }
  } catch (error) {
    logger.error('Failed to get metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Prometheus metrics endpoint
router.get('/metrics/prometheus', (req, res) => {
  try {
    if (process.env.ENABLE_METRICS === 'true') {
      const prometheusMetrics = metricsCollector.getPrometheusMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(prometheusMetrics);
    } else {
      res.status(404).send('Metrics disabled');
    }
  } catch (error) {
    logger.error('Failed to get Prometheus metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).send('Failed to get metrics');
  }
});

export default router;