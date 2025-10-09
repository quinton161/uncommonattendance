@echo off
echo Setting up Frontend Environment Configuration...
echo.

echo Creating .env.local file...
(
echo # Frontend Environment Variables
echo.
echo # Backend API URL
echo NEXT_PUBLIC_API_URL=http://localhost:5000/api
echo.
echo # For production, use your deployed backend URL:
echo # NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
) > .env.local

echo ✅ Created .env.local file successfully!
echo.
echo Frontend environment is now configured to connect to:
echo - Backend API: http://localhost:5000/api
echo.
echo If you deploy to production, update NEXT_PUBLIC_API_URL in .env.local
echo.
pause
