#!/bin/bash

# Deployment script for Basalam Product Manager
set -e

echo "🚀 Starting deployment process..."

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY=${CONTAINER_REGISTRY:-"your-registry"}
IMAGE_NAME="basalam-product-manager"

echo "📋 Deployment Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo "  Registry: $REGISTRY"
echo "  Image: $IMAGE_NAME"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ Required environment variables are not set"
    echo "Please set: DB_HOST, DB_PASSWORD, JWT_SECRET"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test:coverage
npm run test:e2e

# Security audit
echo "🔒 Running security audit..."
npm run security:audit

# Build application
echo "🏗️  Building application..."
npm run build:all

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $REGISTRY/$IMAGE_NAME:$VERSION .
docker tag $REGISTRY/$IMAGE_NAME:$VERSION $REGISTRY/$IMAGE_NAME:latest

# Push to registry (if not local deployment)
if [ "$ENVIRONMENT" != "local" ]; then
    echo "📤 Pushing image to registry..."
    docker push $REGISTRY/$IMAGE_NAME:$VERSION
    docker push $REGISTRY/$IMAGE_NAME:latest
fi

# Deploy based on environment
case $ENVIRONMENT in
    "local")
        echo "🏠 Deploying locally with Docker Compose..."
        docker-compose down
        docker-compose up -d
        ;;
    "staging"|"production")
        echo "☸️  Deploying to Kubernetes ($ENVIRONMENT)..."
        
        # Update image tag in deployment
        sed -i "s|image: .*|image: $REGISTRY/$IMAGE_NAME:$VERSION|g" k8s/deployment.yml
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/namespace.yml
        kubectl apply -f k8s/configmap.yml
        kubectl apply -f k8s/secret.yml
        kubectl apply -f k8s/deployment.yml
        kubectl apply -f k8s/service.yml
        kubectl apply -f k8s/ingress.yml
        
        # Wait for deployment to be ready
        echo "⏳ Waiting for deployment to be ready..."
        kubectl rollout status deployment/basalam-app -n basalam-product-manager --timeout=300s
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Health check
echo "🏥 Running health check..."
sleep 10

if [ "$ENVIRONMENT" = "local" ]; then
    HEALTH_URL="http://localhost:3001/health"
else
    HEALTH_URL="https://your-domain.com/health"
fi

if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Run smoke tests
echo "💨 Running smoke tests..."
if [ "$ENVIRONMENT" != "local" ]; then
    # Add your smoke tests here
    echo "Smoke tests would run here for $ENVIRONMENT"
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Monitoring dashboard: http://localhost:3000 (Grafana)"
echo "📈 Metrics endpoint: $HEALTH_URL/metrics"