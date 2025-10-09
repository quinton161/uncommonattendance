import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    
    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role') || 'student';

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, and password are required'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 400 });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      isActive: true,
      createdAt: new Date()
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'uncommon_attendance_jwt_secret_2024',
      { expiresIn: '7d' }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          profilePicture: newUser.profilePicture,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
