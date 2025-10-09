import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

export async function GET() {
  try {
    await connectToDatabase();
    
    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      message: 'Backend API is working!'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message
    }, { status: 500 });
  }
}
