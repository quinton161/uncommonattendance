@echo off
echo Testing MongoDB Atlas Connection...
echo.

if not exist .env (
    echo ❌ .env file not found!
    echo Please run setup-env.bat first to create the environment file.
    pause
    exit /b 1
)

echo 🔍 Running connection test...
node test-connection.js

echo.
pause
