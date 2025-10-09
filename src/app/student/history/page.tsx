'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StudentNavbar from '@/components/student/StudentNavbar';
import AttendanceHistory from '@/components/student/AttendanceHistory';
import InlineSpinner from '@/components/ui/InlineSpinner';

export default function StudentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login');
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <InlineSpinner size="lg" color="blue" text="Loading" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
          <p className="mt-2 text-gray-600">
            View your complete attendance records and statistics
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Attendance Records</h2>
          </div>
          <AttendanceHistory />
        </div>
      </main>
    </div>
  );
}
