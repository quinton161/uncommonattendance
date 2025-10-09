# 🔍 MongoDB Connection Troubleshooting

## 🚨 Current Issue: Database Connection Failing

### 📋 Checklist to Fix MongoDB Connection

#### 1. **Verify MongoDB Atlas Settings**
- [ ] Go to [MongoDB Atlas](https://cloud.mongodb.com)
- [ ] Navigate to **Network Access**
- [ ] Ensure `0.0.0.0/0` is in the IP Access List
- [ ] If not, click **"Add IP Address"** → **"Allow Access from Anywhere"**

#### 2. **Check Database User Permissions**
- [ ] Go to **Database Access** in MongoDB Atlas
- [ ] Verify user `quinton` exists
- [ ] Ensure user has **"Read and write to any database"** permissions
- [ ] If not, edit user and grant proper permissions

#### 3. **Verify Connection String**
Your current connection string:
```
mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0
```

#### 4. **Set Vercel Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:

```bash
MONGODB_URI=mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=uncommon_attendance_jwt_secret_2024_super_secure_key

NODE_ENV=production

NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app/api
```

#### 5. **Test Connection**
After setting environment variables:
1. Redeploy your Vercel app
2. Visit: `https://your-vercel-app.vercel.app/api/health`
3. Should return: `{"status": "OK", "database": "Connected"}`

## 🔧 Common Solutions

### Solution 1: Network Access Issue
**Problem**: MongoDB Atlas blocking connections
**Fix**: Add `0.0.0.0/0` to Network Access whitelist

### Solution 2: Authentication Issue  
**Problem**: Wrong username/password
**Fix**: Verify credentials in Database Access

### Solution 3: Environment Variables Not Set
**Problem**: Vercel can't access MongoDB URI
**Fix**: Set `MONGODB_URI` in Vercel environment variables

### Solution 4: Database Permissions
**Problem**: User doesn't have write permissions
**Fix**: Grant "Read and write to any database" to user `quinton`

## 🧪 Testing Steps

1. **Test Health Endpoint**: 
   ```
   GET https://your-app.vercel.app/api/health
   ```
   Expected: `{"status": "OK", "database": "Connected"}`

2. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions tab
   - Check logs for MongoDB connection errors

3. **Test Registration**:
   ```
   POST https://your-app.vercel.app/api/auth/register
   ```

## 📞 Next Steps

1. **Check MongoDB Atlas Network Access** (most common issue)
2. **Set Vercel environment variables** 
3. **Redeploy and test health endpoint**
4. **Check Vercel function logs** for detailed errors

The database connection should work once these steps are completed!
