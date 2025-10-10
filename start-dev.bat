@echo off
echo Starting Uncommon Attendance System...
echo.

echo [1/4] Checking and clearing ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Stopping existing backend process %%a
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Stopping existing frontend process %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo Ports cleared!
echo.

echo [2/4] Starting MongoDB Atlas connection check...
echo Make sure your MongoDB Atlas cluster is accessible
echo.

echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5 /nobreak > nul

echo [4/4] Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ System is starting up!
echo.
echo 📱 Frontend: http://localhost:3000 (or 3001 if 3000 is busy)
echo 🔧 Backend:  http://localhost:5000
echo.
echo Press any key to exit...
pause > nul
