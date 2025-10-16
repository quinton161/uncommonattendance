import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import { 
  Activity, 
  Clock, 
  MapPin, 
  Smartphone, 
  Wifi, 
  Battery, 
  Eye,
  MousePointer,
  Keyboard,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  Globe,
  Signal,
  Monitor
} from 'lucide-react';

export default function ActivityTracker({ userId, userRole = 'student' }) {
  const [activities, setActivities] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock activity data
  const mockActivities = [
    {
      id: 1,
      type: 'login',
      action: 'User Login',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      location: 'New York, NY',
      device: 'iPhone 14 Pro',
      ip: '192.168.1.100',
      success: true,
      details: { method: 'password', duration: '2.3s' }
    },
    {
      id: 2,
      type: 'checkin',
      action: 'Attendance Check-in',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      location: 'Campus Building A',
      device: 'iPhone 14 Pro',
      ip: '192.168.1.100',
      success: true,
      details: { method: 'qr_code', coordinates: '40.7128, -74.0060' }
    },
    {
      id: 3,
      type: 'page_view',
      action: 'Dashboard View',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      location: 'New York, NY',
      device: 'iPhone 14 Pro',
      ip: '192.168.1.100',
      success: true,
      details: { duration: '5m 23s', interactions: 12 }
    },
    {
      id: 4,
      type: 'settings',
      action: 'Profile Update',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      location: 'New York, NY',
      device: 'MacBook Pro',
      ip: '192.168.1.101',
      success: true,
      details: { fields_changed: ['email', 'phone'], method: 'form' }
    },
    {
      id: 5,
      type: 'failed_login',
      action: 'Failed Login Attempt',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      location: 'Unknown',
      device: 'Chrome Browser',
      ip: '203.0.113.1',
      success: false,
      details: { reason: 'invalid_password', attempts: 3 }
    }
  ];

  const mockSessionData = {
    currentSession: {
      startTime: new Date(Date.now() - 25 * 60 * 1000),
      duration: '25m 14s',
      pageViews: 8,
      interactions: 34,
      location: 'New York, NY',
      device: 'iPhone 14 Pro',
      browser: 'Safari 17.0',
      os: 'iOS 17.1',
      screenResolution: '1179x2556',
      connectionType: 'WiFi',
      batteryLevel: 78,
      networkSpeed: '45.2 Mbps'
    },
    todayStats: {
      totalSessions: 3,
      totalDuration: '2h 15m',
      avgSessionDuration: '45m',
      pageViews: 24,
      interactions: 156,
      peakActivity: '10:30 AM',
      deviceSwitches: 2
    },
    weeklyStats: {
      totalSessions: 18,
      totalDuration: '12h 45m',
      avgDailyUsage: '1h 49m',
      mostActiveDay: 'Tuesday',
      preferredDevice: 'iPhone',
      locationChanges: 5
    }
  };

  const mockDeviceInfo = {
    primary: {
      type: 'mobile',
      name: 'iPhone 14 Pro',
      os: 'iOS 17.1',
      browser: 'Safari 17.0',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      trusted: true,
      location: 'New York, NY'
    },
    secondary: {
      type: 'desktop',
      name: 'MacBook Pro',
      os: 'macOS Sonoma 14.1',
      browser: 'Chrome 118.0',
      lastSeen: new Date(Date.now() - 45 * 60 * 1000),
      trusted: true,
      location: 'New York, NY'
    }
  };

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setActivities(mockActivities);
      setSessionData(mockSessionData);
      setDeviceInfo(mockDeviceInfo);
      setLoading(false);
    }, 1200);

    // Real-time updates
    const interval = setInterval(() => {
      setSessionData(prev => ({
        ...prev,
        currentSession: {
          ...prev.currentSession,
          duration: updateDuration(prev.currentSession.startTime),
          interactions: prev.currentSession.interactions + Math.floor(Math.random() * 3)
        }
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateDuration = (startTime) => {
    const now = new Date();
    const diff = now - startTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <Zap className="w-4 h-4 text-green-600" />;
      case 'checkin': return <MapPin className="w-4 h-4 text-blue-600" />;
      case 'page_view': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'settings': return <Target className="w-4 h-4 text-orange-600" />;
      case 'failed_login': return <Zap className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type, success) => {
    if (!success) return 'bg-red-50 border-red-200';
    switch (type) {
      case 'login': return 'bg-green-50 border-green-200';
      case 'checkin': return 'bg-blue-50 border-blue-200';
      case 'page_view': return 'bg-purple-50 border-purple-200';
      case 'settings': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Current Session
            <Badge variant="success" className="ml-2 animate-pulse">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {sessionData.currentSession.duration}
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {sessionData.currentSession.pageViews}
              </div>
              <div className="text-sm text-gray-600">Page Views</div>
            </div>
            <div className="text-center">
              <MousePointer className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {sessionData.currentSession.interactions}
              </div>
              <div className="text-sm text-gray-600">Interactions</div>
            </div>
            <div className="text-center">
              <Smartphone className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {sessionData.currentSession.device.split(' ')[0]}
              </div>
              <div className="text-sm text-gray-600">Device</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-green-600" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium">{deviceInfo.primary.name}</div>
                    <div className="text-sm text-gray-600">{deviceInfo.primary.os}</div>
                  </div>
                </div>
                <Badge variant="success">Primary</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-gray-500 mr-2" />
                  <span>{sessionData.currentSession.browser}</span>
                </div>
                <div className="flex items-center">
                  <Signal className="w-4 h-4 text-gray-500 mr-2" />
                  <span>{sessionData.currentSession.connectionType}</span>
                </div>
                <div className="flex items-center">
                  <Battery className="w-4 h-4 text-gray-500 mr-2" />
                  <span>{sessionData.currentSession.batteryLevel}%</span>
                </div>
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 text-gray-500 mr-2" />
                  <span>{sessionData.currentSession.networkSpeed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Today's Usage</span>
                  <span className="text-sm text-gray-600">{sessionData.todayStats.totalDuration}</span>
                </div>
                <Progress value={75} color="blue" size="sm" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Weekly Average</span>
                  <span className="text-sm text-gray-600">{sessionData.weeklyStats.avgDailyUsage}</span>
                </div>
                <Progress value={60} color="green" size="sm" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {sessionData.todayStats.totalSessions}
                  </div>
                  <div className="text-xs text-gray-600">Sessions Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {sessionData.weeklyStats.totalSessions}
                  </div>
                  <div className="text-xs text-gray-600">This Week</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-600" />
              Recent Activities
            </span>
            <Badge variant="outline">Last 24 hours</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  getActivityColor(activity.type, activity.success)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        {!activity.success && (
                          <Badge variant="destructive" size="sm">Failed</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {activity.location}
                        </span>
                        <span className="flex items-center">
                          <Smartphone className="w-3 h-3 mr-1" />
                          {activity.device}
                        </span>
                      </div>
                      {activity.details && (
                        <div className="mt-2 text-xs text-gray-600">
                          {Object.entries(activity.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <strong>{key.replace('_', ' ')}:</strong> {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {activity.ip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
