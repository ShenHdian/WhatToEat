#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v24.18.0/bin:$PATH"

cd /etc/whattoeat

# Backup user data before pulling
cp server/dishes.json /tmp/dishes_backup.json 2>/dev/null
cp server/history.json /tmp/history_backup.json 2>/dev/null
cp server/comments.json /tmp/comments_backup.json 2>/dev/null

git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[$(date)] No updates found."
    exit 0
fi

echo "[$(date)] New updates found! Deploying..."

git pull origin master

# Restore user data (if backup exists, restore; otherwise server.js will create empty)
cp /tmp/dishes_backup.json server/dishes.json 2>/dev/null
cp /tmp/history_backup.json server/history.json 2>/dev/null
cp /tmp/comments_backup.json server/comments.json 2>/dev/null

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
