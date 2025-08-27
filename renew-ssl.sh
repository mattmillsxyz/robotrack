#!/bin/bash

# SSL Certificate Renewal Script for Docker nginx

echo "🔄 Renewing SSL certificate..."

# Stop nginx to free up port 80
echo "🛑 Stopping nginx..."
docker-compose stop nginx

# Renew certificate
echo "📜 Renewing certificate..."
sudo certbot renew --standalone

# Start nginx with new certificate
echo "🚀 Starting nginx..."
docker-compose up -d nginx

echo "✅ SSL renewal complete!"
