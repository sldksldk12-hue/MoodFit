#!/usr/bin/env bash
set -e

echo "🚀 [Deploy Script] Starting deployment pipeline..."

cd /var/www/MoodFit
git fetch origin
git reset --hard origin/main

cd /var/www/MoodFit/backend
./venv/bin/pip install -r requirements.txt --quiet

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/$(ls /root/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:/home/ubuntu/.nvm/versions/node/$(ls /home/ubuntu/.nvm/versions/node 2>/dev/null | tail -n 1)/bin

cd /var/www/MoodFit/frontend
rm -rf dist node_modules/.vite
./node_modules/.bin/vite build || npx vite build || npm run build

chmod -R 755 /var/www/MoodFit
systemctl restart moodfit-backend nginx

echo "=========================================="
echo "🎉 [Deploy Script] Deployment successfully completed!"
echo "=========================================="
