# 🍃 MongoDB Atlas Setup Guide

## 📋 **Your MongoDB Connection Details**

**Cluster URL**: `mongodb+srv://quinton:<db_password>@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0`

**Username**: `quinton`  
**Database**: `attendance_system`  
**Cluster**: `cluster0.cyjo4zp.mongodb.net`

## 🚀 **Quick Setup Steps**

### 1. **Run Environment Setup**
```bash
# Run this to create environment files
setup.bat
```

### 2. **Configure Your Password**
- Open `backend\.env` file
- Replace `YOUR_PASSWORD_HERE` with your actual MongoDB Atlas password
- Save the file

### 3. **Test Connection**
```bash
# Test if MongoDB connection works
cd backend
test-db.bat
```

### 4. **Start the System**
```bash
# Launch both frontend and backend
start-dev.bat
```

## 🔧 **Manual Setup (Alternative)**

If you prefer to set up manually:

### Backend Environment (`backend\.env`)
```env
# Database - MongoDB Atlas
MONGODB_URI=mongodb+srv://quinton:YOUR_ACTUAL_PASSWORD@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret - Change this to something secure
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Port
PORT=5000

# Environment
NODE_ENV=development

# File Upload Path
UPLOAD_PATH=./uploads/
```

### Frontend Environment (`.env.local`)
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🛠️ **MongoDB Atlas Configuration**

### Required Settings in MongoDB Atlas:
1. **Database Name**: `attendance_system`
2. **Collections** (will be created automatically):
   - `users` - Student and admin accounts
   - `attendances` - Check-in/out records

### Network Access:
- Make sure your IP address is whitelisted in MongoDB Atlas
- Or use `0.0.0.0/0` for development (allow all IPs)

### Database User:
- Username: `quinton`
- Password: `[Your secure password]`
- Roles: `readWrite` on `attendance_system` database

## 🔍 **Troubleshooting**

### Connection Issues:
```bash
# Test your connection
cd backend
node test-connection.js
```

### Common Errors:

**Authentication Failed**
- Check username and password in connection string
- Verify database user exists in MongoDB Atlas

**Network Error**
- Check internet connection
- Verify IP whitelist in MongoDB Atlas Network Access

**Database Not Found**
- Database will be created automatically on first connection
- Make sure database name is `attendance_system`

## 📊 **Database Schema**

The system will automatically create these collections:

### `users` Collection
```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
  role: "student" | "admin",
  profilePicture: "/uploads/profiles/image.jpg",
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

### `attendances` Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  date: "2024-01-01", // YYYY-MM-DD format
  checkInTime: "09:15", // HH:MM format
  checkOutTime: "17:30", // HH:MM format (optional)
  checkInLocation: { lat: -17.8292, lng: 31.0522 },
  checkOutLocation: { lat: -17.8295, lng: 31.0528 }, // optional
  status: "checked-in" | "checked-out",
  notes: "Optional notes",
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 **Next Steps**

1. ✅ **Setup Complete**: Run `setup.bat`
2. ✅ **Configure Password**: Edit `backend\.env`
3. ✅ **Test Connection**: Run `backend\test-db.bat`
4. ✅ **Start System**: Run `start-dev.bat`
5. ✅ **Create Admin**: Register first admin account
6. ✅ **Test Features**: Create students and test check-in/out

Your MongoDB Atlas cluster is ready for the Student Attendance System! 🚀
