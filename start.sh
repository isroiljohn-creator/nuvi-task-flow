#!/bin/sh
set -e

PORT="${PORT:-3000}"

# Log direktoriyalarini yaratish
mkdir -p /var/log/nginx /var/cache/nginx /var/run

# nginx.conf ni o'qib PORT ni almashtirish va vaqtinchalik faylga yozish
sed "s/\$PORT/$PORT/g" /app/nginx.conf > /tmp/nginx.conf

# Nginx ni vaqtinchalik config bilan ishga tushirish
nginx -c /tmp/nginx.conf -g 'daemon off;'
