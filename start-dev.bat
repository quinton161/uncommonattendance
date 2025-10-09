@echo off
echo Starting Uncommon Attendance System...
echo.

echo [1/3] Starting MongoDB (make sure MongoDB is running)
echo.

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ System is starting up!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000
echo.
echo Press any key to exit...
pause > nul
