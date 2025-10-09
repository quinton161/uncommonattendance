@echo off
echo Setting up Backend Environment Configuration...
echo.

echo Creating .env file with MongoDB Atlas configuration...
echo.

(
echo # Database - MongoDB Atlas
echo MONGODB_URI=mongodb+srv://quinton:YOUR_PASSWORD_HERE@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true^&w=majority^&appName=Cluster0
echo.
echo # JWT Secret - IMPORTANT: Change this to a secure random string
echo JWT_SECRET=attendance_system_jwt_secret_2024_change_this_to_something_very_long_and_random_for_production
echo.
echo # Server Port
echo PORT=5000
echo.
echo # Environment
echo NODE_ENV=development
echo.
echo # File Upload Path
echo UPLOAD_PATH=./uploads/
) > .env

echo ✅ Created .env file successfully!
echo.
echo ⚠️  IMPORTANT: Please edit the .env file and:
echo    1. Replace YOUR_PASSWORD_HERE with your actual MongoDB password
echo    2. Change the JWT_SECRET to a secure random string
echo.
echo Opening .env file for editing...
notepad .env

echo.
echo Setup complete! Make sure to save your changes in the .env file.
pause
