#!/bin/sh
set -e

PORT="${PORT:-3000}"

# Nginx binary topish
NGINX_BIN=$(which nginx 2>/dev/null || find /nix -name nginx -type f 2>/dev/null | head -1)
echo "Using nginx: $NGINX_BIN"

# PORT ni nginx.conf ga o'rnatish
sed "s/\$PORT/$PORT/g" /app/nginx.conf > /tmp/nginx_app.conf

echo "Starting nginx on port $PORT"
$NGINX_BIN -c /tmp/nginx_app.conf -g 'daemon off;'
