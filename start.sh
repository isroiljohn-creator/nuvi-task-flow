#!/bin/sh
# Railway $PORT muhit o'zgaruvchisini Nginx config ga qo'llash
PORT="${PORT:-3000}"
sed -i "s/\$PORT/$PORT/g" /app/nginx.conf
cp /app/nginx.conf /etc/nginx/nginx.conf
nginx -g 'daemon off;'
