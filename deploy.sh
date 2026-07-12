#!/bin/bash
cd /etc/whattoeat

# Backup user data
cp server/dishes.json /tmp/dishes_backup.json 2>/dev/null
cp server/data.db /tmp/data_backup.db 2>/dev/null
rm -f server/dishes.json server/data.db

git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" = "$REMOTE" ]; then
    cp /tmp/dishes_backup.json server/dishes.json 2>/dev/null
    cp /tmp/data_backup.db server/data.db 2>/dev/null
    echo "[$(date)] No updates found."
    exit 0
fi

echo "[$(date)] New updates found! Deploying..."

git pull origin master

# Restore user data
cp /tmp/dishes_backup.json server/dishes.json 2>/dev/null
cp /tmp/data_backup.db server/data.db 2>/dev/null

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
