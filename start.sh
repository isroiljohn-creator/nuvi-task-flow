#!/bin/sh
set -e

PORT="${PORT:-3000}"

# Nginx binary topish
NGINX_BIN=$(which nginx 2>/dev/null || find /root/.nix-profile/bin -name nginx 2>/dev/null | head -1 || find /nix -name nginx -type f 2>/dev/null | head -1)
echo "Using nginx: $NGINX_BIN"
echo "Starting nginx on port $PORT"

# PORT ni nginx.conf ga o'rnatish
sed "s/\$PORT/$PORT/g" /app/nginx.conf > /tmp/nginx_app.conf

# Nginx ni stderr ga error log bilan ishga tushirish
$NGINX_BIN -c /tmp/nginx_app.conf -e /dev/stderr -g 'daemon off;'
