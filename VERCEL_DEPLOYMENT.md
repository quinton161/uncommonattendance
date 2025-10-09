# 🚀 Vercel Full-Stack Deployment Guide

## ✅ Current Setup Status

- [x] Frontend configured for Vercel
- [x] Backend configured as Vercel serverless functions
- [x] MongoDB Atlas connection string updated
- [x] Dependencies merged into main package.json

## 🔧 Environment Variables for Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

### Required Variables:
```bash
MONGODB_URI=mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=uncommon_attendance_jwt_secret_2024_super_secure_key_quinton

NODE_ENV=production

NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app/api
```

**Important**: Replace `your-vercel-app` with your actual Vercel app name!

## 🗄️ MongoDB Atlas Setup Verification

Your MongoDB connection is configured for:
- **Cluster**: cluster0.cyjo4zp.mongodb.net
- **Username**: quinton
- **Password**: 1307
- **Database**: attendance_system

### Verify MongoDB Access:
1. Go to MongoDB Atlas → Network Access
2. Ensure `0.0.0.0/0` is whitelisted (allows all IPs)
3. Go to Database Access → Verify user `quinton` exists

## 📱 API Endpoints

Once deployed, your API will be available at:
- `https://your-vercel-app.vercel.app/api/health` - Health check
- `https://your-vercel-app.vercel.app/api/auth/login` - User login
- `https://your-vercel-app.vercel.app/api/auth/register` - User registration
- `https://your-vercel-app.vercel.app/api/attendance/check-in` - Check in
- `https://your-vercel-app.vercel.app/api/admin/dashboard` - Admin dashboard

## 🎯 Deployment Steps

1. **Push to GitHub** (already done ✅)
2. **Set Environment Variables** in Vercel dashboard
3. **Redeploy** (Vercel will auto-deploy on push)
4. **Test API endpoints**

## 🧪 Testing Your Deployment

1. Visit your Vercel app URL
2. Test health endpoint: `https://your-app.vercel.app/api/health`
3. Try registering a new account
4. Test login functionality

## 🔍 Troubleshooting

### If API calls fail:
- Check Vercel function logs
- Verify environment variables are set
- Ensure MongoDB Atlas allows connections from 0.0.0.0/0

### If MongoDB connection fails:
- Verify connection string in Vercel environment variables
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

## 🎉 Success Indicators

- ✅ Health endpoint returns 200 OK
- ✅ Registration creates new users
- ✅ Login returns JWT tokens
- ✅ Attendance features work properly

Your full-stack app is now running entirely on Vercel!
