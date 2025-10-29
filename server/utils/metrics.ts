import { Request, Response } from 'express';

interface Metrics {
  requests: {
    total: number;
    success: number;
    error: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  };
  response_time: {
    total: number;
    count: number;
    average: number;
  };
  active_connections: number;
  uptime: number;
  memory_usage: NodeJS.MemoryUsage;
  system_info: {
    node_version: string;
    platform: string;
    arch: string;
  };
}

class MetricsCollector {
  private metrics: Metrics;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byMethod: {},
        byStatus: {}
      },
      response_time: {
        total: 0,
        count: 0,
        average: 0
      },
      active_connections: 0,
      uptime: 0,
      memory_usage: process.memoryUsage(),
      system_info: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Update memory usage every 30 seconds
    setInterval(() => {
      this.metrics.memory_usage = process.memoryUsage();
      this.metrics.uptime = Date.now() - this.startTime;
    }, 30000);
  }

  // Middleware to collect request metrics
  collectRequestMetrics() {
    return (req: Request, res: Response, next: Function) => {
      const start = Date.now();
      
      // Increment active connections
      this.metrics.active_connections++;
      
      // Track request
      this.metrics.requests.total++;
      this.metrics.requests.byMethod[req.method] = 
        (this.metrics.requests.byMethod[req.method] || 0) + 1;

      res.on('finish', () => {
        // Decrement active connections
        this.metrics.active_connections--;
        
        // Calculate response time
        const responseTime = Date.now() - start;
        this.metrics.response_time.total += responseTime;
        this.metrics.response_time.count++;
        this.metrics.response_time.average = 
          this.metrics.response_time.total / this.metrics.response_time.count;

        // Track status codes
        const statusCode = res.statusCode.toString();
        this.metrics.requests.byStatus[statusCode] = 
          (this.metrics.requests.byStatus[statusCode] || 0) + 1;

        // Track success/error
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.metrics.requests.success++;
        } else {
          this.metrics.requests.error++;
        }
      });

      next();
    };
  }

  // Get current metrics
  getMetrics(): Metrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      memory_usage: process.memoryUsage()
    };
  }

  // Export metrics in Prometheus format
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    
    let output = '';
    
    // Request metrics
    output += `# HELP http_requests_total Total number of HTTP requests\n`;
    output += `# TYPE http_requests_total counter\n`;
    output += `http_requests_total ${metrics.requests.total}\n\n`;
    
    output += `# HELP http_requests_success_total Total number of successful HTTP requests\n`;
    output += `# TYPE http_requests_success_total counter\n`;
    output += `http_requests_success_total ${metrics.requests.success}\n\n`;
    
    output += `# HELP http_requests_error_total Total number of failed HTTP requests\n`;
    output += `# TYPE http_requests_error_total counter\n`;
    output += `http_requests_error_total ${metrics.requests.error}\n\n`;
    
    // Response time metrics
    output += `# HELP http_request_duration_ms Average HTTP request duration in milliseconds\n`;
    output += `# TYPE http_request_duration_ms gauge\n`;
    output += `http_request_duration_ms ${metrics.response_time.average}\n\n`;
    
    // Active connections
    output += `# HELP http_active_connections Current number of active HTTP connections\n`;
    output += `# TYPE http_active_connections gauge\n`;
    output += `http_active_connections ${metrics.active_connections}\n\n`;
    
    // Uptime
    output += `# HELP process_uptime_seconds Process uptime in seconds\n`;
    output += `# TYPE process_uptime_seconds gauge\n`;
    output += `process_uptime_seconds ${Math.floor(metrics.uptime / 1000)}\n\n`;
    
    // Memory usage
    output += `# HELP process_memory_usage_bytes Process memory usage in bytes\n`;
    output += `# TYPE process_memory_usage_bytes gauge\n`;
    output += `process_memory_usage_bytes{type="rss"} ${metrics.memory_usage.rss}\n`;
    output += `process_memory_usage_bytes{type="heapTotal"} ${metrics.memory_usage.heapTotal}\n`;
    output += `process_memory_usage_bytes{type="heapUsed"} ${metrics.memory_usage.heapUsed}\n`;
    output += `process_memory_usage_bytes{type="external"} ${metrics.memory_usage.external}\n\n`;
    
    return output;
  }

  // Reset metrics (useful for testing)
  reset(): void {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byMethod: {},
        byStatus: {}
      },
      response_time: {
        total: 0,
        count: 0,
        average: 0
      },
      active_connections: 0,
      uptime: 0,
      memory_usage: process.memoryUsage(),
      system_info: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    this.startTime = Date.now();
  }
}

export const metricsCollector = new MetricsCollector();