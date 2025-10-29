#!/bin/bash

echo "🔍 Testing Basalam Product Manager Monitoring & Deployment Features"
echo "=================================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "\n${BLUE}1. Checking if demo server is running...${NC}"
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Server is running on port 3001${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start with: npm run server:demo${NC}"
    exit 1
fi

# Test health endpoint
echo -e "\n${BLUE}2. Testing Health Check Endpoint${NC}"
echo "GET /health"
curl -s http://localhost:3001/health | jq '.'

# Test metrics endpoint
echo -e "\n${BLUE}3. Testing Metrics Endpoint${NC}"
echo "GET /metrics"
curl -s http://localhost:3001/metrics | jq '.requests'

# Test Prometheus metrics
echo -e "\n${BLUE}4. Testing Prometheus Metrics Endpoint${NC}"
echo "GET /metrics/prometheus"
curl -s http://localhost:3001/metrics/prometheus | head -10

# Generate some test traffic
echo -e "\n${BLUE}5. Generating Test Traffic${NC}"
echo "Making requests to generate metrics..."

for i in {1..5}; do
    echo -n "."
    curl -s http://localhost:3001/api/demo > /dev/null
    sleep 0.5
done

for i in {1..2}; do
    echo -n "."
    curl -s http://localhost:3001/api/demo/error > /dev/null
    sleep 0.5
done

echo -n "."
curl -s http://localhost:3001/api/demo/slow > /dev/null &
echo ""

# Show updated metrics
echo -e "\n${BLUE}6. Updated Metrics After Test Traffic${NC}"
curl -s http://localhost:3001/metrics | jq '{
  total_requests: .requests.total,
  success_requests: .requests.success,
  error_requests: .requests.error,
  average_response_time: .response_time.average,
  active_connections: .active_connections,
  uptime_seconds: (.uptime / 1000 | floor)
}'

# Test readiness and liveness probes
echo -e "\n${BLUE}7. Testing Kubernetes Health Probes${NC}"
echo "Readiness probe:"
curl -s http://localhost:3001/ready | jq '.'

echo -e "\nLiveness probe:"
curl -s http://localhost:3001/live | jq '.'

# Show log file content
echo -e "\n${BLUE}8. Recent Log Entries${NC}"
if [ -f "logs/app.log" ]; then
    echo "Last 10 log entries:"
    tail -10 logs/app.log
else
    echo "Log file not found at logs/app.log"
fi

# Check monitoring stack status
echo -e "\n${BLUE}9. Monitoring Stack Status${NC}"
if command -v docker &> /dev/null; then
    echo "Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(prometheus|grafana|alertmanager|node-exporter|postgres-exporter)" || echo "Monitoring containers not running"
else
    echo "Docker not available"
fi

echo -e "\n${GREEN}🎉 Monitoring Test Complete!${NC}"
echo -e "\n${YELLOW}Available Endpoints:${NC}"
echo "  • Health Check: http://localhost:3001/health"
echo "  • Metrics (JSON): http://localhost:3001/metrics"
echo "  • Prometheus Metrics: http://localhost:3001/metrics/prometheus"
echo "  • Demo API: http://localhost:3001/api/demo"
echo "  • Demo Error: http://localhost:3001/api/demo/error"
echo "  • Demo Slow: http://localhost:3001/api/demo/slow"

echo -e "\n${YELLOW}Monitoring Dashboards (when containers are running):${NC}"
echo "  • Grafana: http://localhost:3000 (admin/admin)"
echo "  • Prometheus: http://localhost:9090"
echo "  • Alertmanager: http://localhost:9093"

echo -e "\n${YELLOW}To start monitoring stack:${NC}"
echo "  npm run monitoring:up"

echo -e "\n${YELLOW}To stop everything:${NC}"
echo "  npm run monitoring:down"
echo "  Ctrl+C to stop the demo server"