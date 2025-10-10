# Backend Deployment Guide

## Option 1: Deploy to Render (Recommended)

1. **Go to [Render.com](https://render.com)** and sign in with GitHub
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**: `quinton161/uncommonattendance`
4. **Configure the service**:
   - **Name**: `uncommonattendance-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=uncommon_attendance_jwt_secret_2024_super_secure_key
   PORT=10000
   ```

6. **Deploy** - Render will automatically deploy your backend

## Option 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Connect GitHub and select your repository
3. Select the `backend` folder
4. Add the same environment variables as above
5. Deploy

## Option 3: Deploy to Heroku

1. Install Heroku CLI
2. Run these commands in the `backend` directory:
   ```bash
   heroku create uncommonattendance-backend
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0"
   heroku config:set JWT_SECRET="uncommon_attendance_jwt_secret_2024_super_secure_key"
   git subtree push --prefix backend heroku main
   ```

## After Backend Deployment

Once your backend is deployed, you'll get a URL like:
- Render: `https://uncommonattendance-backend.onrender.com`
- Railway: `https://uncommonattendance-backend.up.railway.app`
- Heroku: `https://uncommonattendance-backend.herokuapp.com`

**Update the frontend environment variables** with your actual backend URL and redeploy the frontend.

## Quick Test

After deployment, test your backend by visiting:
`https://your-backend-url.com/api/health`

You should see a JSON response with status "OK".
