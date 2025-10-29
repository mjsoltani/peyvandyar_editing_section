import request from 'supertest';
import express from 'express';
import healthRoutes from '../../routes/health';

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] })
  }))
}));

const app = express();
app.use('/', healthRoutes);

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics when enabled', async () => {
      process.env.ENABLE_METRICS = 'true';
      
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('response_time');
      expect(response.body).toHaveProperty('active_connections');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory_usage');
    });

    it('should return 404 when metrics disabled', async () => {
      process.env.ENABLE_METRICS = 'false';
      
      await request(app)
        .get('/metrics')
        .expect(404);
    });
  });

  describe('GET /metrics/prometheus', () => {
    it('should return Prometheus metrics when enabled', async () => {
      process.env.ENABLE_METRICS = 'true';
      
      const response = await request(app)
        .get('/metrics/prometheus')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('process_uptime_seconds');
      expect(response.text).toContain('process_memory_usage_bytes');
    });
  });
});