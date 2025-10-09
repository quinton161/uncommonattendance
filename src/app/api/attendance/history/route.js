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

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const decoded = authenticateToken(authHeader);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query = { userId: decoded.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    // Calculate total hours and add to each record
    const recordsWithHours = attendanceRecords.map(record => {
      let totalHours = null;
      if (record.checkOutTime) {
        const checkIn = new Date(`1970-01-01T${record.checkInTime}:00`);
        const checkOut = new Date(`1970-01-01T${record.checkOutTime}:00`);
        const diffMs = checkOut - checkIn;
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }

      return {
        _id: record._id,
        date: record.date,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        checkInLocation: record.checkInLocation,
        checkOutLocation: record.checkOutLocation,
        status: record.status,
        isLate: record.isLate,
        notes: record.notes,
        totalHours: totalHours,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });

    // Calculate statistics
    const stats = {
      totalDays: totalRecords,
      completedDays: attendanceRecords.filter(r => r.status === 'checked-out').length,
      lateDays: attendanceRecords.filter(r => r.isLate).length,
      totalHours: recordsWithHours.reduce((sum, r) => sum + (r.totalHours || 0), 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        records: recordsWithHours,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalRecords: totalRecords,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        statistics: stats
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    
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
