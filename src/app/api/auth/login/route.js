import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    console.log('✅ Connected to MongoDB Atlas');
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

// Prevent re-compilation during development
const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'uncommon_attendance_jwt_secret_2024',
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
