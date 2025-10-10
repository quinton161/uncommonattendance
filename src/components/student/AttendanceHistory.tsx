'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import InlineSpinner from '@/components/ui/InlineSpinner';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'checked-in' | 'checked-out';
  isLate?: boolean;
  checkInLocation: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  totalHours?: number;
  notes?: string;
}

interface AttendanceHistoryData {
  attendance: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    totalDays: number;
    checkedOutDays: number;
    currentlyCheckedIn: number;
  };
}

export default function AttendanceHistory() {
  const { token } = useAuth();
  const [data, setData] = useState<AttendanceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAttendanceHistory = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/attendance/history?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAttendanceHistory(currentPage);
  }, [currentPage, fetchAttendanceHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'checked-out') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Complete
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Incomplete
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <InlineSpinner size="md" color="blue" text="Loading attendance records..." />
      </div>
    );
  }

  if (!data || data.attendance.length === 0) {
    return (
      <div className="p-6 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
        <p className="text-gray-600">Your attendance history will appear here once you start checking in.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{data.stats.totalDays}</div>
          <div className="text-sm text-blue-700">Total Days</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{data.stats.checkedOutDays}</div>
          <div className="text-sm text-green-700">Complete Days</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {data.attendance.filter(record => record.isLate).length}
          </div>
          <div className="text-sm text-red-700">Late Arrivals</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {data.stats.totalDays > 0 ? Math.round((data.stats.checkedOutDays / data.stats.totalDays) * 100) : 0}%
          </div>
          <div className="text-sm text-purple-700">Completion Rate</div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="space-y-4">
        {data.attendance.map((record) => (
          <div key={record._id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">{formatDate(record.date)}</span>
                {getStatusBadge(record.status)}
              </div>
              {record.totalHours && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{record.totalHours}h</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check-in */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Check-in
                  {record.isLate && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      LATE
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className={record.isLate ? 'text-red-600 font-medium' : ''}>
                      {record.checkInTime}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {record.checkInLocation.lat.toFixed(4)}, {record.checkInLocation.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Check-out */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Check-out</div>
                {record.checkOutTime && record.checkOutLocation ? (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{record.checkOutTime}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        {record.checkOutLocation.lat.toFixed(4)}, {record.checkOutLocation.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Not checked out</div>
                )}
              </div>
            </div>

            {record.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                <div className="text-sm text-gray-600">{record.notes}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(data.pagination.pages, currentPage + 1))}
              disabled={currentPage === data.pagination.pages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
