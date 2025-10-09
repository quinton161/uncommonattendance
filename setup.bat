@echo off
echo Setting up Student Attendance System...
echo.

echo [1/4] Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend installation failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend installation failed!
    pause
    exit /b 1
)

echo Installing MongoDB driver...
call npm install mongodb@4.17.2
if %errorlevel% neq 0 (
    echo ❌ MongoDB driver installation failed!
    pause
    exit /b 1
)

cd ..

echo.
echo [3/4] Setting up Environment Files...

echo Setting up frontend environment...
call setup-frontend-env.bat

echo.
echo Setting up backend environment...
cd backend
call setup-env.bat
cd ..

echo.
echo [4/4] Setup Complete!
echo.
echo 📋 Next Steps:
echo 1. Make sure MongoDB is running
echo 2. Edit backend\.env with your MongoDB URI
echo 3. Run start-dev.bat to start the system
echo.
echo Press any key to exit...
pause > nul
