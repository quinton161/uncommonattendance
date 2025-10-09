import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb.js';

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
