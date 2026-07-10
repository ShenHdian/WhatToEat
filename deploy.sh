#!/bin/bash
cd /etc/whattoeat

git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date)] No updates found."
    exit 0
fi

echo "[$(date)] New updates found! Deploying..."

git pull origin master

# Install deps
cd /etc/whattoeat/server && npm install
cd /etc/whattoeat/client && npm install

# Build frontend
cd /etc/whattoeat/client && npm run build

# Kill old process on port 3001 (if any)
fuser -k 3001/tcp 2>/dev/null
sleep 1

# Start fresh with PM2
cd /etc/whattoeat/server
pm2 start server.js --name whattoeat --update-env
pm2 save

echo "[$(date)] Deploy complete!"
