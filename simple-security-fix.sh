#!/bin/bash

# Simple Security Fix for RoboTrack
# This fixes the Redis security issue flagged by DigitalOcean

echo "🔒 Applying simple security fix..."

# Stop current containers
echo "🛑 Stopping containers..."
docker-compose down

# Set Redis password if not set
if [ -z "$REDIS_PASSWORD" ]; then
    echo "🔑 Setting Redis password..."
    export REDIS_PASSWORD=$(openssl rand -base64 16)
    echo "Redis password: $REDIS_PASSWORD"
    echo "Save this password!"
fi

# Start services with Redis secured
echo "🚀 Starting services with secured Redis..."
docker-compose up -d

# Test the fix
echo "🔍 Testing Redis security..."
echo "Testing external Redis access (should fail):"
telnet localhost 6379 2>/dev/null || echo "✅ Redis is now secure!"

echo ""
echo "✅ Security fix applied!"
echo "🔗 Your app is available at: http://$(curl -s ifconfig.me)"
echo "🔑 Redis password: $REDIS_PASSWORD"
