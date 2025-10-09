'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import InlineSpinner from '@/components/ui/InlineSpinner';
import StudentNavbar from '@/components/student/StudentNavbar';
import AttendanceCard from '@/components/student/AttendanceCard';
import CheckInButton from '@/components/student/CheckInButton';
import CheckOutButton from '@/components/student/CheckOutButton';
import AttendanceHistory from '@/components/student/AttendanceHistory';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface AttendanceStatus {
  attendance: any;
  date: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  totalHours: number | null;
}

export default function StudentDashboard() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login');
      return;
    }

    if (user && token) {
      fetchAttendanceStatus();
    }
  }, [user, loading, token, router]);

  const fetchAttendanceStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/attendance/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleAttendanceUpdate = () => {
    fetchAttendanceStatus();
  };

  if (loading || isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <InlineSpinner size="lg" color="blue" text="Loading" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-chillax text-heading-lg text-black">
            Welcome back, {user.name}!
          </h1>
          <div className="mt-2 flex items-center space-x-4 font-avenir text-body-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {currentDate}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {currentTime}
            </div>
          </div>
        </div>

        {/* Today's Attendance Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Attendance Card */}
          <div className="lg:col-span-2">
            <AttendanceCard 
              attendanceStatus={attendanceStatus}
              onUpdate={handleAttendanceUpdate}
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            {!attendanceStatus?.hasCheckedIn ? (
              <CheckInButton onSuccess={handleAttendanceUpdate} />
            ) : !attendanceStatus?.hasCheckedOut ? (
              <CheckOutButton onSuccess={handleAttendanceUpdate} />
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-green-600 mb-2">
                  <Clock className="h-8 w-8 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-green-900 mb-1">
                  Day Complete!
                </h3>
                <p className="text-sm text-green-700">
                  You've successfully checked in and out today.
                </p>
                {attendanceStatus?.totalHours && (
                  <p className="text-sm font-medium text-green-800 mt-2">
                    Total Hours: {attendanceStatus.totalHours}h
                  </p>
                )}
              </div>
            )}

            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                {user.profilePicture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profilePicture}`}
                    alt={user.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
          </div>
          <AttendanceHistory />
        </div>
      </main>
    </div>
  );
}
