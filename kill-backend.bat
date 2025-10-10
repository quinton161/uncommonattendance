@echo off
echo Stopping any processes using port 5000...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ✅ Port 5000 is now free
echo You can now start your backend server
echo.
pause
