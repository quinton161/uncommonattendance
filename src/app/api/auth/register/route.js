import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import database connection and User model
import { connectToDatabase } from '../../../lib/mongodb.js';
import User from '../../../lib/models/User.js';

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
