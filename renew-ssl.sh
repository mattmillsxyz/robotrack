#!/bin/bash

# SSL Certificate Renewal Script for Docker nginx
#
# Uses certbot's webroot method: nginx keeps running and serves the ACME
# challenge from /var/www/certbot. The old --standalone flow needed port 80
# free, so it had to stop nginx first -- and when that stop failed, renewal
# failed silently every night until the certificate expired.

set -euo pipefail

# cron runs with an unpredictable working directory, and docker compose
# needs to find docker-compose.yml next to this script.
cd "$(dirname "$0")"

# cron mail isn't configured on this droplet, so without a log a failed
# renewal leaves no trace anywhere.
exec >> /var/log/robotrack-ssl-renew.log 2>&1
echo "===== $(date -Is) renewal run ====="

echo "📜 Renewing certificate..."
certbot renew --webroot -w /var/www/certbot --non-interactive

# nginx reads certificates at startup, so a renewal has no effect until it
# reloads. Harmless on the days when nothing was due for renewal.
echo "🔄 Reloading nginx..."
docker compose exec -T nginx nginx -s reload

echo "✅ SSL renewal complete!"
