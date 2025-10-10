'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import InlineSpinner from '@/components/ui/InlineSpinner';

interface ChartData {
  date: string;
  checkIns: number;
  checkOuts: number;
  attendanceRate: number;
}

export default function AttendanceChart() {
  const { token } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const fetchChartData = useCallback(async () => {
    try {
      setError(null);
      // Get last 14 days of data to ensure we capture 5 weekdays
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log('AttendanceChart API call:', { startDate, endDate, limit: 1000 });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        processChartData(data.data.attendance || []);
      } else {
        const errorData = await response.json();
        console.error('Chart API error:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch attendance data');
      }
    } catch (error: any) {
      console.error('Failed to fetch chart data:', error);
      setError(error.message || 'Failed to load chart data');
      // Still process empty data to show the chart structure
      processChartData([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchChartData();
    }
  }, [token, fetchChartData]);

  const processChartData = (attendanceData: any[]) => {
    // Group data by date
    const dateGroups: { [key: string]: any[] } = {};
    
    if (Array.isArray(attendanceData)) {
      attendanceData.forEach(record => {
        if (record && record.date) {
          if (!dateGroups[record.date]) {
            dateGroups[record.date] = [];
          }
          dateGroups[record.date].push(record);
        }
      });
    }

    // Generate chart data for last 5 weekdays (Monday to Friday)
    const chartData: ChartData[] = [];
    let daysAdded = 0;
    let daysBack = 0;
    
    while (daysAdded < 5 && daysBack < 14) { // Look back up to 14 days to find 5 weekdays
      const date = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Only include weekdays (Monday = 1, Tuesday = 2, ..., Friday = 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = date.toISOString().split('T')[0];
        const dayData = dateGroups[dateString] || [];
        
        const checkIns = dayData.length;
        const checkOuts = dayData.filter(record => record.status === 'checked-out').length;
        const attendanceRate = checkIns > 0 ? Math.round((checkOuts / checkIns) * 100) : 0;

        chartData.unshift({ // Add to beginning to maintain chronological order
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          checkIns,
          checkOuts,
          attendanceRate
        });
        
        daysAdded++;
      }
      
      daysBack++;
    }

    setChartData(chartData);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <InlineSpinner size="md" color="blue" text="Loading chart data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Attendance Trends (Weekdays)</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Line Chart
            </button>
            <button
              onClick={fetchChartData}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Refresh data"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading chart data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {!error && chartData.every(d => d.checkIns === 0 && d.checkOuts === 0) ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600">
              Attendance data for weekdays (Monday-Friday) will appear here once students start checking in.
            </p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="checkIns" fill="#3b82f6" name="Check-ins" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="checkOuts" fill="#10b981" name="Check-outs" radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="checkIns" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    name="Check-ins"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="checkOuts" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    name="Check-outs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                    name="Completion Rate (%)"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {chartData.reduce((sum, day) => sum + day.checkIns, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {chartData.reduce((sum, day) => sum + day.checkOuts, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Check-outs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(chartData.reduce((sum, day) => sum + day.attendanceRate, 0) / chartData.length) || 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(chartData.reduce((sum, day) => sum + day.checkIns, 0) / 5 * 10) / 10}
              </div>
              <div className="text-sm text-gray-600">Daily Average</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
