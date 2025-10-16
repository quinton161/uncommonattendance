import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import LoadingScreen from '../../components/ui/LoadingScreen';
import apiService from '../../services/api';
import toastService from '../../services/toastService';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  Bell,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  MapPin,
  XCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAdminDashboard(token);
      
      // Map backend response to frontend format
      setDashboardData({
        totalUsers: data.totalUsers || { students: 0, admins: 0 },
        activeUsers: data.stats?.totalStudents || 0,
        todayAttendance: data.stats?.checkedInToday || 0,
        attendanceRate: data.stats?.attendanceRate || 0,
        recentActivity: data.recentActivity || [],
        currentlyCheckedIn: data.currentlyCheckedIn || [],
        todayAttendanceList: data.todayAttendance || [],
        lateArrivals: (data.todayAttendance || []).filter(record => record.isLate),
        onTimeArrivals: (data.todayAttendance || []).filter(record => !record.isLate)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toastService.error('Failed to load dashboard data');
      // Set fallback data
      setDashboardData({
        totalUsers: { students: 0, admins: 0 },
        activeUsers: 0,
        totalAttendance: 0,
        todayAttendance: 0,
        attendanceRate: 0,
        recentActivity: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Admin Dashboard
                </h2>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-600">Vincent Bohlen Hub, Victoria Falls</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Bell className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                  Notifications
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {typeof dashboardData?.totalUsers === 'object' 
                        ? (dashboardData.totalUsers.students || 0) + (dashboardData.totalUsers.admins || 0)
                        : (dashboardData?.totalUsers || 0)
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.activeUsers || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Attendance */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Attendance</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.todayAttendance || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Attendance Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.attendanceRate || 0}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Late Arrivals Today */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className={`h-6 w-6 ${
                    (dashboardData?.lateArrivals?.length || 0) > 0 ? 'text-red-500' : 'text-gray-400'
                  }`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Late Today</dt>
                    <dd className={`text-lg font-medium ${
                      (dashboardData?.lateArrivals?.length || 0) > 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {dashboardData?.lateArrivals?.length || 0}
                      {(dashboardData?.lateArrivals?.length || 0) > 0 && (
                        <span className="text-xs text-red-500 block">students</span>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <Activity className="inline h-5 w-5 mr-2" />
                Recent Activity
              </h3>
              {dashboardData?.recentActivity?.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== Math.min(4, dashboardData.recentActivity.length - 1) && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.type === 'success' ? 'bg-green-500' : 
                                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}>
                                <CheckCircle className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">{activity.description}</p>
                                <p className="text-xs text-gray-400">{activity.user}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {activity.timestamp}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">Activity will appear here as users interact with the system.</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Attendance */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <Calendar className="inline h-5 w-5 mr-2" />
                Today's Attendance
              </h3>
              
              {/* Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Check-ins:</span>
                  <span className="font-medium">{dashboardData?.todayAttendance || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-green-600">On Time:</span>
                  <span className="font-medium text-green-600">{dashboardData?.onTimeArrivals?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-red-600">Late Arrivals:</span>
                  <span className="font-medium text-red-600">{dashboardData?.lateArrivals?.length || 0}</span>
                </div>
              </div>

              {/* Late Arrivals List */}
              {dashboardData?.lateArrivals?.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Late Arrivals Today
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {dashboardData.lateArrivals.slice(0, 5).map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              {student.userId?.name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-red-600">
                              Arrived at {student.checkInTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dashboardData.lateArrivals.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{dashboardData.lateArrivals.length - 5} more late arrivals
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-400" />
                  <p className="text-sm text-green-600 font-medium mt-2">No late arrivals today! 🎉</p>
                  <p className="text-xs text-gray-500">All students arrived on time</p>
                </div>
              )}
              
              {/* Currently Checked In */}
              {dashboardData?.currentlyCheckedIn?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Currently Present ({dashboardData.currentlyCheckedIn.length})
                  </h4>
                  <div className="text-xs text-gray-500">
                    {dashboardData.currentlyCheckedIn.slice(0, 3).map((student, index) => (
                      <span key={index} className="inline-block mr-2">
                        {student.userId?.name || 'Unknown'}
                      </span>
                    ))}
                    {dashboardData.currentlyCheckedIn.length > 3 && (
                      <span>+{dashboardData.currentlyCheckedIn.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => window.location.href = '/admin/students'}
                >
                  <Users className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">Manage Users</span>
                </button>
                
                <button
                  type="button"
                  className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => window.location.href = '/admin/attendance'}
                >
                  <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">View Attendance</span>
                </button>
                
                <button
                  type="button"
                  className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => window.location.href = '/admin/reports'}
                >
                  <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">Generate Reports</span>
                </button>
                
                <button
                  type="button"
                  className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Settings className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">System Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>System Maintenance:</strong> Scheduled maintenance window is planned for this weekend from 2:00 AM to 4:00 AM EST.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
