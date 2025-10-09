# 🚀 Deployment Guide for Uncommon Attendance System

This guide will help you deploy your full-stack attendance system to GitHub and Vercel without complications.

## 📋 Pre-Deployment Checklist

### ✅ Files Created/Updated for Deployment
- [x] `.env.example` - Environment variables template
- [x] `backend/.env.example` - Backend environment template  
- [x] `vercel.json` - Vercel deployment configuration
- [x] `.gitignore` - Excludes sensitive files from Git
- [x] `next.config.mjs` - Optimized for production
- [x] `backend/server.js` - Updated CORS for production

## 🔧 Step 1: Prepare Your Environment Files

### Frontend Environment (.env.local)
Create `.env.local` in the root directory:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Backend Environment (.env)
Create `.env` in the `backend/` directory:
```bash
# Database - MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_system

# JWT Secret (REQUIRED - Generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL for CORS (REQUIRED)
FRONTEND_URL=https://your-vercel-app.vercel.app

# File Upload Path
UPLOAD_PATH=./uploads/
```

## 🗄️ Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create a Cluster**: Choose the free tier
3. **Create Database User**: 
   - Go to Database Access
   - Add new user with username/password
4. **Whitelist IP Addresses**:
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allows all IPs)
5. **Get Connection String**:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password

## 🐙 Step 3: Deploy to GitHub

1. **Initialize Git Repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - Uncommon Attendance System"
```

2. **Create GitHub Repository**:
   - Go to GitHub and create a new repository
   - Name it `uncommon-attendance` or similar

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/yourusername/uncommon-attendance.git
git branch -M main
git push -u origin main
```

## ⚡ Step 4: Deploy Backend (Railway/Render)

### Option A: Railway (Recommended)
1. Go to [Railway](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Choose the `backend` folder as root directory
6. Set environment variables in Railway dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL` (you'll get this from Vercel)

### Option B: Render
1. Go to [Render](https://render.com)
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variables in Render dashboard

## 🔥 Step 5: Deploy Frontend (Vercel)

1. **Go to Vercel**: Visit [Vercel](https://vercel.com)
2. **Sign up/Login** with GitHub
3. **Import Project**: Click "New Project" → Import your GitHub repository
4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Set Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```

6. **Deploy**: Click "Deploy"

## 🔄 Step 6: Update CORS Configuration

After getting your Vercel URL:

1. **Update Backend Environment**:
   - In Railway/Render dashboard
   - Set `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - Redeploy backend

2. **Update Frontend Environment**:
   - In Vercel dashboard
   - Update `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api`
   - Redeploy frontend

## 🧪 Step 7: Test Your Deployment

1. **Visit your Vercel URL**: `https://your-app.vercel.app`
2. **Test Registration**: Create a new account
3. **Test Login**: Sign in with your account
4. **Test Check-in/out**: Try the attendance features
5. **Check Admin Features**: Test admin dashboard

## 🔍 Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly

### Issue: Database Connection Failed
**Solution**: 
- Check MongoDB Atlas connection string
- Ensure IP whitelist includes `0.0.0.0/0`
- Verify database user credentials

### Issue: Environment Variables Not Working
**Solution**:
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- Ensure no extra spaces in values

### Issue: Build Failures
**Solution**:
- Check all dependencies are in `package.json`
- Ensure Node.js version compatibility
- Review build logs for specific errors

## 📱 Custom Domain (Optional)

### For Vercel:
1. Go to your project dashboard
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### For Backend:
1. Add custom domain in Railway/Render
2. Update `NEXT_PUBLIC_API_URL` in Vercel
3. Update `FRONTEND_URL` in backend

## 🔐 Security Checklist

- [x] Environment variables are not committed to Git
- [x] Strong JWT secret is used
- [x] MongoDB Atlas has proper access controls
- [x] CORS is configured for production domains only
- [x] Rate limiting is enabled
- [x] Helmet security headers are active

## 📞 Support

If you encounter issues:
1. Check the deployment logs in Vercel/Railway/Render
2. Verify all environment variables are set correctly
3. Test API endpoints directly using the backend URL
4. Check browser console for frontend errors

## 🎉 Success!

Your Uncommon Attendance System should now be live and accessible worldwide! 

**Frontend**: `https://your-app.vercel.app`
**Backend**: `https://your-backend.railway.app`

Remember to update the URLs in this guide with your actual deployment URLs.
