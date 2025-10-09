import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Force dynamic rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  profilePicture: { type: String, default: null },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Attendance Schema
const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  checkInTime: { type: String, required: true, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  checkOutTime: { type: String, default: null, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  checkInLocation: { type: locationSchema, required: true },
  checkOutLocation: { type: locationSchema, default: null },
  status: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-in' },
  isLate: { type: Boolean, default: false },
  notes: { type: String, maxlength: 500, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent re-compilation during development
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

// Authentication middleware
const authenticateToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access token required');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'uncommon_attendance_jwt_secret_2024');
  return decoded;
};

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const decoded = authenticateToken(authHeader);
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      }, { status: 403 });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get current week dates (Monday to Sunday)
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }

    // Get statistics
    const [
      totalStudents,
      activeStudents,
      todayAttendance,
      currentlyCheckedIn,
      weeklyAttendance,
      recentActivity
    ] = await Promise.all([
      // Total students
      User.countDocuments({ role: 'student' }),
      
      // Active students
      User.countDocuments({ role: 'student', isActive: true }),
      
      // Today's attendance
      Attendance.find({ date: today }).populate('userId', 'name email profilePicture'),
      
      // Currently checked in
      Attendance.find({ date: today, status: 'checked-in' }).populate('userId', 'name email profilePicture'),
      
      // Weekly attendance
      Attendance.find({ date: { $in: weekDates } }).populate('userId', 'name email profilePicture'),
      
      // Recent activity (last 10 records)
      Attendance.find({})
        .populate('userId', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Calculate weekly statistics
    const weeklyStats = weekDates.map(date => {
      const dayAttendance = weeklyAttendance.filter(a => a.date === date);
      return {
        date: date,
        total: dayAttendance.length,
        checkedOut: dayAttendance.filter(a => a.status === 'checked-out').length,
        late: dayAttendance.filter(a => a.isLate).length
      };
    });

    // Calculate attendance rate
    const attendanceRate = activeStudents > 0 ? 
      Math.round((todayAttendance.length / activeStudents) * 100) : 0;

    // Format recent activity
    const formattedActivity = recentActivity.map(record => ({
      _id: record._id,
      user: {
        name: record.userId?.name || 'Unknown User',
        email: record.userId?.email || '',
        profilePicture: record.userId?.profilePicture || null
      },
      action: record.status === 'checked-out' ? 'Checked Out' : 'Checked In',
      time: record.status === 'checked-out' ? record.checkOutTime : record.checkInTime,
      date: record.date,
      isLate: record.isLate,
      timestamp: record.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          todayAttendance: todayAttendance.length,
          currentlyCheckedIn: currentlyCheckedIn.length,
          attendanceRate: attendanceRate
        },
        todayAttendance: todayAttendance.map(record => ({
          _id: record._id,
          user: {
            _id: record.userId?._id,
            name: record.userId?.name || 'Unknown User',
            email: record.userId?.email || '',
            profilePicture: record.userId?.profilePicture || null
          },
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          status: record.status,
          isLate: record.isLate,
          notes: record.notes
        })),
        currentlyCheckedIn: currentlyCheckedIn.map(record => ({
          _id: record._id,
          user: {
            _id: record.userId?._id,
            name: record.userId?.name || 'Unknown User',
            email: record.userId?.email || '',
            profilePicture: record.userId?.profilePicture || null
          },
          checkInTime: record.checkInTime,
          isLate: record.isLate
        })),
        weeklyStats: weeklyStats,
        recentActivity: formattedActivity
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
