@echo off
echo [1/2] Building frontend...
cd /d "%~dp0client"
call npx vite build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b %errorlevel%
)

echo [2/2] Starting server...
cd /d "%~dp0server"
node server.js
