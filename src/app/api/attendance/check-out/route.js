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

export async function PUT(request) {
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

    // Get today's date and current time
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      userId: decoded.userId,
      date: today,
      status: 'checked-in'
    });

    if (!attendance) {
      return NextResponse.json({
        success: false,
        message: 'No active check-in found for today'
      }, { status: 400 });
    }

    // Update attendance record
    attendance.checkOutTime = currentTime;
    attendance.checkOutLocation = {
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lng)
    };
    attendance.status = 'checked-out';
    attendance.updatedAt = new Date();
    
    if (notes) {
      attendance.notes = notes;
    }

    await attendance.save();

    // Calculate total hours
    const checkIn = new Date(`1970-01-01T${attendance.checkInTime}:00`);
    const checkOut = new Date(`1970-01-01T${attendance.checkOutTime}:00`);
    const diffMs = checkOut - checkIn;
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    return NextResponse.json({
      success: true,
      message: 'Check-out successful',
      data: {
        attendance: {
          _id: attendance._id,
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          checkInLocation: attendance.checkInLocation,
          checkOutLocation: attendance.checkOutLocation,
          status: attendance.status,
          isLate: attendance.isLate,
          notes: attendance.notes,
          totalHours: totalHours
        }
      }
    });

  } catch (error) {
    console.error('Check-out error:', error);
    
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
