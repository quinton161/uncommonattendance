import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://quinton:1307@cluster0.cyjo4zp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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

export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const decoded = authenticateToken(authHeader);
    
    const { location, notes } = await request.json();

    // Validate location
    if (!location || !location.lat || !location.lng) {
      return NextResponse.json({
        success: false,
        message: 'Location coordinates are required'
      }, { status: 400 });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    // Check if user already checked in today
    const existingAttendance = await Attendance.findOne({
      userId: decoded.userId,
      date: today
    });

    if (existingAttendance) {
      return NextResponse.json({
        success: false,
        message: 'You have already checked in today'
      }, { status: 400 });
    }

    // Determine if late (assuming 9:00 AM is the standard time)
    const standardTime = '09:00';
    const isLate = currentTime > standardTime;

    // Create attendance record
    const attendance = new Attendance({
      userId: decoded.userId,
      date: today,
      checkInTime: currentTime,
      checkInLocation: {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      },
      status: 'checked-in',
      isLate: isLate,
      notes: notes || ''
    });

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      data: {
        attendance: {
          _id: attendance._id,
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          checkInLocation: attendance.checkInLocation,
          status: attendance.status,
          isLate: attendance.isLate,
          notes: attendance.notes
        }
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    
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
