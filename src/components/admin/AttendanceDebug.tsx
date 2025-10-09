'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AttendanceDebug() {
  const { token } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAttendanceAPI = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('Testing attendance API with dates:', { startDate, endDate });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { error: 'Failed to parse JSON', response: responseText };
      }

      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        data: data,
        dates: { startDate, endDate },
        url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`
      });
    } catch (error: any) {
      console.error('API test error:', error);
      setDebugInfo({
        error: error?.message || 'Unknown error occurred',
        stack: error?.stack || 'No stack trace available'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      testAttendanceAPI();
    }
  }, [token]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Attendance API Debug</h3>
        <button
          onClick={testAttendanceAPI}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>
      
      {debugInfo && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">API Response:</h4>
            <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
