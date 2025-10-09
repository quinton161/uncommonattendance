'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import InlineSpinner from '@/components/ui/InlineSpinner';
import { Calendar, Download, Filter, MapPin, Clock, User } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'checked-in' | 'checked-out';
  isLate?: boolean;
  checkInLocation: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  totalHours?: number;
}

export default function AttendancePage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    userId: ''
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }

    if (user && token) {
      fetchAttendance();
    }
  }, [user, loading, token, router, filters]);

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/attendance?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.data.attendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('format', 'csv');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/attendance/export?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attendance_${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export attendance:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <InlineSpinner size="lg" color="blue" text="Loading Attendance..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="mt-2 text-gray-600">View and export detailed attendance data</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={!filters.startDate || !filters.endDate}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Records ({attendance.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-6">
              <InlineSpinner size="md" color="blue" text="Loading attendance records..." />
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600">
                No attendance records match your current filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {attendance.map((record) => (
                <div key={record._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {record.userId.profilePicture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${record.userId.profilePicture}`}
                          alt={record.userId.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{record.userId.name}</h3>
                        <p className="text-xs text-gray-500">{record.userId.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{record.date}</div>
                        <div className="text-xs text-gray-500">Date</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-sm font-medium flex items-center justify-center space-x-1 ${
                          record.isLate ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          <span>{record.checkInTime}</span>
                          {record.isLate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              LATE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Check In</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {record.checkOutTime || '-'}
                        </div>
                        <div className="text-xs text-gray-500">Check Out</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {record.totalHours ? `${record.totalHours}h` : '-'}
                        </div>
                        <div className="text-xs text-gray-500">Hours</div>
                      </div>

                      <div className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'checked-out' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status === 'checked-out' ? 'Complete' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
