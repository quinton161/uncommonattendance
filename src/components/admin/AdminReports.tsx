'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock,
  FileText
} from 'lucide-react';
import InlineSpinner from '@/components/ui/InlineSpinner';

interface AttendanceSummary {
  student: {
    _id: string;
    name: string;
    email: string;
  };
  stats: {
    checkedInDays: number;
    completedDays: number;
    lateDays: number;
    attendanceRate: number;
    completionRate: number;
    lateRate: number;
    totalPossibleDays: number;
  };
}

interface OverallStats {
  totalStudents: number;
  totalDays: number;
  totalPossibleAttendance: number;
  totalActualAttendance: number;
  totalLateArrivals: number;
  overallAttendanceRate: number;
  averageCompletionRate: number;
  averageLateRate: number;
}

interface ReportsData {
  summary: AttendanceSummary[];
  overallStats: OverallStats;
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

interface AdminReportsProps {
  token: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminReports({ token }: AdminReportsProps) {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchReportsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/reports/attendance-summary?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response structures
        if (data.success && data.data) {
          setReportsData(data.data);
        } else if (data.summary) {
          // Direct data structure
          setReportsData(data);
        } else {
          toast.error('Unexpected data format received');
        }
      } else {
        toast.error('Failed to fetch reports data');
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to fetch reports data');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, token]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const exportAttendanceData = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/attendance/export?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_${startDate}_to_${endDate}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_${startDate}_to_${endDate}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        toast.success(`Attendance data exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Prepare chart data
  const attendanceChartData = reportsData?.summary.map(item => ({
    name: item.student.name.split(' ')[0], // First name only for chart
    attendanceRate: item.stats.attendanceRate,
    completionRate: item.stats.completionRate,
    lateRate: item.stats.lateRate,
    checkedInDays: item.stats.checkedInDays,
    lateDays: item.stats.lateDays
  })) || [];

  const attendanceDistribution = reportsData ? [
    { name: 'Excellent (90-100%)', value: reportsData.summary.filter(s => s.stats.attendanceRate >= 90).length },
    { name: 'Good (80-89%)', value: reportsData.summary.filter(s => s.stats.attendanceRate >= 80 && s.stats.attendanceRate < 90).length },
    { name: 'Average (70-79%)', value: reportsData.summary.filter(s => s.stats.attendanceRate >= 70 && s.stats.attendanceRate < 80).length },
    { name: 'Poor (60-69%)', value: reportsData.summary.filter(s => s.stats.attendanceRate >= 60 && s.stats.attendanceRate < 70).length },
    { name: 'Critical (<60%)', value: reportsData.summary.filter(s => s.stats.attendanceRate < 60).length }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive attendance analytics and insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => exportAttendanceData('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportAttendanceData('json')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8">
          <InlineSpinner size="lg" color="blue" text="Generating reports..." />
        </div>
      ) : reportsData ? (
        <>
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportsData.overallStats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Attendance Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportsData.overallStats.overallAttendanceRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Completion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportsData.overallStats.averageCompletionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportsData.overallStats.totalLateArrivals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Working Days</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportsData.period.totalDays}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Rate Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Attendance Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendanceRate" fill="#3B82F6" name="Attendance Rate %" />
                  <Bar dataKey="completionRate" fill="#10B981" name="Completion Rate %" />
                  <Bar dataKey="lateRate" fill="#EF4444" name="Late Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Student Report */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detailed Student Report</h3>
              <p className="mt-1 text-sm text-gray-600">
                Attendance calculated based on working days (Monday-Friday) only. Weekends are excluded.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Days Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late Arrivals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportsData.summary.map((item) => (
                    <tr key={item.student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.student.name}</div>
                          <div className="text-sm text-gray-500">{item.student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.stats.checkedInDays} / {item.stats.totalPossibleDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.stats.completedDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          item.stats.lateDays > 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {item.stats.lateDays}
                        </span>
                        {item.stats.lateDays > 0 && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.stats.lateRate}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.stats.attendanceRate >= 90 ? 'bg-green-600' :
                                item.stats.attendanceRate >= 80 ? 'bg-blue-600' :
                                item.stats.attendanceRate >= 70 ? 'bg-yellow-600' :
                                item.stats.attendanceRate >= 60 ? 'bg-orange-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${item.stats.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.stats.attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="h-2 rounded-full bg-green-600"
                              style={{ width: `${item.stats.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.stats.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Select a date range to generate reports.</p>
        </div>
      )}
    </div>
  );
}
