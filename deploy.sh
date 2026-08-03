#!/usr/bin/env bash
set -e

echo "🚀 [Deploy Script] Starting deployment pipeline..."

cd /var/www/MoodFit
git fetch origin
git reset --hard origin/main

cd /var/www/MoodFit/backend
./venv/bin/pip install -r requirements.txt --quiet

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/$(ls /root/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:/home/ubuntu/.nvm/versions/node/$(ls /home/ubuntu/.nvm/versions/node 2>/dev/null | tail -n 1)/bin

export VITE_API_BASE_URL=""
cd /var/www/MoodFit/frontend
rm -rf dist node_modules/.vite
./node_modules/.bin/vite build || npx vite build || npm run build

chmod -R 755 /var/www/MoodFit || true

cat << 'EOT' > /etc/nginx/sites-available/moodfit
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name moodfit.kro.kr _;

    root /var/www/MoodFit/frontend/dist;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /static/ {
        alias /var/www/MoodFit/backend/static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        proxy_next_upstream error timeout invalid_header http_502 http_503 http_504;
        proxy_next_upstream_tries 15;
        proxy_next_upstream_timeout 45s;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOT

ln -sf /etc/nginx/sites-available/moodfit /etc/nginx/sites-enabled/moodfit
rm -f /etc/nginx/sites-enabled/default

if [ -f /etc/letsencrypt/live/moodfit.kro.kr/fullchain.pem ]; then
  cat << 'EOT' > /etc/nginx/sites-available/moodfit
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name moodfit.kro.kr _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name moodfit.kro.kr _;

    ssl_certificate /etc/letsencrypt/live/moodfit.kro.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/moodfit.kro.kr/privkey.pem;

    root /var/www/MoodFit/frontend/dist;
    index index.html;

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location /static/ {
        alias /var/www/MoodFit/backend/static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        proxy_next_upstream error timeout invalid_header http_502 http_503 http_504;
        proxy_next_upstream_tries 15;
        proxy_next_upstream_timeout 45s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOT
fi

ln -sf /etc/nginx/sites-available/moodfit /etc/nginx/sites-enabled/moodfit
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart moodfit-backend nginx

echo "=========================================="
echo "🎉 [Deploy Script] Deployment successfully completed!"
echo "=========================================="
