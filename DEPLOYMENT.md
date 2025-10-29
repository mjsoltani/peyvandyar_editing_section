# Deployment Guide

## Production Readiness Checklist

### Environment Configuration
- [ ] Set all required environment variables in `.env.production`
- [ ] Configure database connection strings
- [ ] Set secure JWT secrets
- [ ] Configure Basalam API credentials
- [ ] Set up SSL certificates
- [ ] Configure CORS origins
- [ ] Set up rate limiting parameters

### Security
- [ ] Enable HTTPS in production
- [ ] Configure security headers
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure firewall rules
- [ ] Set up VPN access for admin panel
- [ ] Enable database encryption at rest

### Monitoring & Logging
- [ ] Configure log aggregation
- [ ] Set up metrics collection
- [ ] Configure alerting rules
- [ ] Set up health checks
- [ ] Configure backup procedures
- [ ] Set up monitoring dashboards

### Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling
- [ ] Configure caching strategies
- [ ] Optimize Docker images
- [ ] Set resource limits in Kubernetes

## Deployment Methods

### 1. Docker Compose (Simple Deployment)

```bash
# Build and start services
npm run docker:build
npm run docker:run

# Check logs
npm run docker:logs

# Stop services
npm run docker:stop
```

### 2. Kubernetes (Production Deployment)

```bash
# Deploy to Kubernetes
./scripts/deploy.sh production v1.0.0

# Check deployment status
kubectl get pods -n basalam-product-manager

# View logs
kubectl logs -f deployment/basalam-app -n basalam-product-manager
```

### 3. CI/CD Pipeline

The project includes GitHub Actions workflows for:
- **CI Pipeline**: Runs tests, linting, and security checks
- **CD Pipeline**: Builds and deploys to staging/production

## Environment Variables

### Required Variables
```bash
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=basalam_product_manager
DB_USER=postgres
DB_PASSWORD=secure-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Basalam API
BASALAM_CLIENT_ID=your-client-id
BASALAM_CLIENT_SECRET=your-client-secret
BASALAM_REDIRECT_URI=https://your-domain.com/api/auth/callback

# Admin
ADMIN_CARD_NUMBER=1234567890123456
```

### Optional Variables
```bash
# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/basalam-product-manager/app.log

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Monitoring Setup

### 1. Start Monitoring Stack

```bash
# Start Prometheus, Grafana, and Alertmanager
npm run monitoring:up

# Access dashboards
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Alertmanager: http://localhost:9093
```

### 2. Configure Alerts

Edit `monitoring/alert_rules.yml` to customize alerting rules:
- High error rate
- High response time
- High memory usage
- Database connectivity
- Application availability

### 3. Dashboard Access

- **Application Metrics**: http://localhost:3001/metrics
- **Prometheus Metrics**: http://localhost:3001/metrics/prometheus
- **Health Check**: http://localhost:3001/health

## Backup Procedures

### Automated Backups

```bash
# Run backup script
./scripts/backup.sh

# Schedule with cron (daily at 2 AM)
0 2 * * * /path/to/scripts/backup.sh
```

### Manual Backup

```bash
# Database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup.sql

# Restore from backup
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup.sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify network connectivity
   - Check firewall rules

2. **High Memory Usage**
   - Monitor heap usage in metrics
   - Check for memory leaks
   - Adjust container memory limits

3. **API Rate Limiting**
   - Check Basalam API rate limits
   - Implement exponential backoff
   - Monitor API usage metrics

4. **SSL Certificate Issues**
   - Verify certificate validity
   - Check certificate chain
   - Update certificate before expiry

### Log Analysis

```bash
# View application logs
docker-compose logs -f app

# View specific service logs
kubectl logs -f deployment/basalam-app -n basalam-product-manager

# Search logs for errors
grep "ERROR" /var/log/basalam-product-manager/app.log
```

## Performance Optimization

### Database Optimization
- Create indexes on frequently queried columns
- Use connection pooling
- Monitor slow queries
- Regular VACUUM and ANALYZE

### Application Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Optimize bundle sizes

### Infrastructure Optimization
- Use horizontal pod autoscaling
- Configure resource requests/limits
- Use persistent volumes for data
- Implement load balancing

## Security Best Practices

1. **Network Security**
   - Use private networks
   - Configure firewalls
   - Enable VPN access
   - Use service mesh for internal communication

2. **Application Security**
   - Regular security audits
   - Dependency vulnerability scanning
   - Input validation and sanitization
   - Rate limiting and DDoS protection

3. **Data Security**
   - Encrypt data at rest and in transit
   - Regular backups with encryption
   - Access control and audit logging
   - Secure secret management

## Scaling Considerations

### Horizontal Scaling
- Use Kubernetes HPA
- Configure load balancers
- Implement session affinity if needed
- Use external session storage

### Vertical Scaling
- Monitor resource usage
- Adjust CPU and memory limits
- Use appropriate instance types
- Consider database scaling

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling
- Query optimization
- Consider database sharding for large datasets