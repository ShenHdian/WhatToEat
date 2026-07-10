#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v24.18.0/bin:$PATH"

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

cd /etc/whattoeat/server && npm install
cd /etc/whattoeat/client && npm install

cd /etc/whattoeat/client && npm run build

fuser -k 3001/tcp 2>/dev/null
sleep 1

cd /etc/whattoeat/server
pm2 delete whattoeat 2>/dev/null
pm2 start server.js --name whattoeat --update-env
pm2 save

echo "[$(date)] Deploy complete!"
