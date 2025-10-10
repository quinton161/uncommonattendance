'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import InlineSpinner from '@/components/ui/InlineSpinner';
import AdminNavbar from '@/components/admin/AdminNavbar';
import StatsCards from '@/components/admin/StatsCards';
import LiveAttendance from '@/components/admin/LiveAttendance';
import RecentActivity from '@/components/admin/RecentActivity';
import AttendanceChart from '@/components/admin/AttendanceChart';

interface DashboardData {
  stats: {
    totalStudents: number;
    checkedInToday: number;
    currentlyPresent: number;
    attendanceRate: number;
  };
  todayAttendance: any[];
  currentlyCheckedIn: any[];
  recentActivity: any[];
  totalUsers: {
    students: number;
    admins: number;
  };
}

export default function AdminDashboard() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }

    if (user && token) {
      fetchDashboardData();
    }
  }, [user, loading, token, router, fetchDashboardData]);

  if (loading || isLoadingData) {
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
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor student attendance and system activity
          </p>
        </div>

        {/* Stats Cards */}
        {dashboardData && (
          <StatsCards stats={dashboardData.stats} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Live Attendance */}
          <div className="lg:col-span-1">
            {dashboardData && (
              <LiveAttendance 
                currentlyCheckedIn={dashboardData.currentlyCheckedIn}
                todayAttendance={dashboardData.todayAttendance}
              />
            )}
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            {dashboardData && (
              <RecentActivity recentActivity={dashboardData.recentActivity} />
            )}
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="mt-8">
          <AttendanceChart />
        </div>
      </main>
    </div>
  );
}
