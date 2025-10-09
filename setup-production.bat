@echo off
echo 🚀 Uncommon Attendance - Production Setup Helper
echo.

echo This script will help you prepare for deployment.
echo.

echo 📋 Checklist:
echo [1] MongoDB Atlas cluster ready?
echo [2] GitHub repository created?
echo [3] Environment variables prepared?
echo.

echo 🔧 Next Steps:
echo 1. Copy .env.example to .env.local (frontend)
echo 2. Copy backend/.env.example to backend/.env
echo 3. Fill in your actual values in both .env files
echo 4. Push to GitHub: git add . && git commit -m "Ready for deployment" && git push
echo 5. Deploy backend to Railway/Render
echo 6. Deploy frontend to Vercel
echo 7. Update CORS settings with actual URLs
echo.

echo 📖 For detailed instructions, see:
echo - DEPLOYMENT_GUIDE.md
echo - DEPLOYMENT_CHECKLIST.md
echo.

echo Press any key to exit...
pause > nul
