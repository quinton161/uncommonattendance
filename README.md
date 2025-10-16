# 🎯 Uncommon Attendance System

A modern, full-stack attendance tracking system built with React, Node.js, Express, and MongoDB. Features real-time check-in/out with GPS location tracking, role-based dashboards, and comprehensive attendance analytics.

## ✨ Features

### 👩‍🎓 Student Features
- **Daily Check-in/Out**: Mark attendance with GPS location tracking
- **Personal Dashboard**: View attendance status and history
- **Profile Management**: Upload profile pictures and manage account
- **Attendance History**: Track personal attendance records with statistics

### 👨‍💻 Admin Features
- **Live Dashboard**: Real-time view of student attendance
- **Student Management**: View and manage all registered students
- **Attendance Analytics**: Charts and statistics for attendance trends
- **Data Export**: Export attendance data as CSV or JSON
- **User Management**: Activate/deactivate student accounts

### 🔧 Technical Features
- **GPS Location Tracking**: Secure location capture for check-in/out
- **JWT Authentication**: Secure token-based authentication
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live attendance status updates
- **File Upload**: Profile picture management with Multer
- **Data Validation**: Comprehensive input validation with Zod

## 🛠️ Tech Stack

### Frontend
- **React 18** - JavaScript library for building user interfaces
- **Create React App** - React development environment
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **React Toastify** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload middleware
- **Bcrypt** - Password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd uncommonattendance
```

### 2. Install All Dependencies
```bash
# Install all dependencies for root, backend, and client
npm run install-all
```

### 3. Backend Setup
```bash
cd backend

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# MONGODB_URI=mongodb://localhost:27017/attendance_system
# JWT_SECRET=your_super_secret_jwt_key
# PORT=5000
```

### 4. Client Setup
```bash
cd client

# Create environment file (optional - defaults to localhost:5000)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 5. Start the Application
```bash
# Option 1: Start both frontend and backend together (from root)
npm run dev

# Option 2: Start separately
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

### 6. Access the Application
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 👥 Demo Accounts

For testing purposes, you can create accounts or use these demo credentials:

### Admin Account
- **Email**: admin@demo.com
- **Password**: password123
- **Role**: Admin

### Student Account
- **Email**: student@demo.com
- **Password**: password123
- **Role**: Student

## 📱 Usage Guide

### For Students
1. **Register/Login**: Create an account or sign in
2. **Check In**: Click "Check In Now" to mark attendance (location required)
3. **Check Out**: Click "Check Out Now" when leaving
4. **View History**: See your attendance records and statistics

### For Admins
1. **Dashboard**: Monitor live attendance and system statistics
2. **Students**: View and manage all registered students
3. **Attendance**: View detailed attendance records with filters
4. **Export Data**: Download attendance reports as CSV

## 🗂️ Database Schema

### Users Collection
```javascript
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "profilePicture": "/uploads/profiles/image.jpg",
  "role": "student" | "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Attendance Collection
```javascript
{
  "_id": "ObjectId",
  "date": "2024-01-01",
  "checkInTime": "09:15",
  "checkOutTime": "17:30",
  "checkInLocation": { "lat": -17.8292, "lng": 31.0522 },
  "checkOutLocation": { "lat": -17.8295, "lng": 31.0528 },
  "status": "checked-out",
  "notes": "Optional notes"
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Attendance (Student)
- `POST /api/attendance/check-in` - Check in
- `PUT /api/attendance/check-out` - Check out
- `GET /api/attendance/status` - Get today's status
- `GET /api/attendance/history` - Get attendance history

### Admin
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/attendance` - All attendance records
- `GET /api/admin/students` - All students
- `GET /api/admin/attendance/export` - Export data

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Comprehensive validation with express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet**: Security headers middleware

## 📦 Deployment

### Frontend Deployment (React on Netlify/Vercel)

#### Option 1: Netlify
1. Build the React app:
   ```bash
   cd client
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository to Netlify
   - Set build command: `cd client && npm run build`
   - Set publish directory: `client/build`
   - Add environment variable: `REACT_APP_API_URL=https://your-backend-url.com/api`

#### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy from client directory:
   ```bash
   cd client
   vercel --prod
   ```
3. Set environment variable in Vercel dashboard: `REACT_APP_API_URL`

### Backend Deployment (Express on Railway/Render)

#### Option 1: Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. Deploy from backend directory:
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```
3. Add environment variables in Railway dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (Railway sets this automatically)
   - `CORS_ORIGIN` (your frontend URL)

#### Option 2: Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables in Render dashboard

### Full-Stack Deployment Notes
- Frontend and backend are deployed separately
- Update `REACT_APP_API_URL` in frontend to point to deployed backend
- Update `CORS_ORIGIN` in backend to allow requests from deployed frontend
- Use MongoDB Atlas for production database
- Consider using Cloudinary for file uploads in production

### Database (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in backend environment

### Cloudinary (for image uploads)
1. Create a Cloudinary account
2. Go to your Dashboard and get your API Environment variables
3. Update `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in your Vercel environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce the problem

## 🎯 Future Enhancements

- [ ] QR Code check-in/out
- [ ] Push notifications
- [ ] Email attendance summaries
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Biometric authentication
- [ ] Geofencing for location validation
- [ ] Multi-tenant support

---

**Built with ❤️ using modern web technologies**