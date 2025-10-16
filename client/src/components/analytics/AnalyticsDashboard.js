import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import StatCard from '../ui/StatCard';
import Progress, { CircularProgress } from '../ui/Progress';
import Badge from '../ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  MousePointer,
  Smartphone,
  Monitor,
  Globe,
  MapPin
} from 'lucide-react';

export default function AnalyticsDashboard({ userRole = 'admin' }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  const mockAnalytics = {
    overview: {
      totalUsers: 1247,
      activeUsers: 892,
      attendanceRate: 87.5,
      avgSessionTime: '24m 32s',
      totalSessions: 15420,
      bounceRate: 12.3,
      newUsers: 156,
      returningUsers: 736
    },
    attendance: {
      dailyAverage: 89.2,
      weeklyTrend: 5.7,
      monthlyGoal: 90,
      streakRecord: 23,
      lateArrivals: 45,
      earlyDepartures: 12,
      perfectAttendance: 234,
      improvementRate: 15.8
    },
    engagement: {
      pageViews: 45230,
      uniqueVisitors: 3420,
      avgPagesPerSession: 4.2,
      timeOnSite: '18m 45s',
      clickThroughRate: 23.4,
      conversionRate: 8.9,
      socialShares: 156,
      downloads: 89
    },
    devices: {
      mobile: 65.4,
      desktop: 28.7,
      tablet: 5.9
    },
    locations: [
      { country: 'United States', users: 456, percentage: 36.6 },
      { country: 'Canada', users: 234, percentage: 18.8 },
      { country: 'United Kingdom', users: 189, percentage: 15.2 },
      { country: 'Australia', users: 123, percentage: 9.9 },
      { country: 'Germany', users: 98, percentage: 7.9 }
    ],
    realTime: {
      activeNow: 47,
      todayCheckins: 234,
      currentSessions: 89,
      liveEvents: 156
    },
    performance: {
      pageLoadTime: 1.2,
      serverResponse: 0.8,
      errorRate: 0.3,
      uptime: 99.9
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1500);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive tracking and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Badge variant="success" className="animate-pulse">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Live
          </Badge>
        </div>
      </div>

      {/* Real-time Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.realTime.activeNow}</div>
              <div className="text-sm text-gray-600">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.realTime.todayCheckins}</div>
              <div className="text-sm text-gray-600">Today's Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.realTime.currentSessions}</div>
              <div className="text-sm text-gray-600">Current Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.realTime.liveEvents}</div>
              <div className="text-sm text-gray-600">Live Events</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analytics.overview.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
          change="+12.5% from last month"
          changeType="positive"
          className="hover-lift"
        />
        <StatCard
          title="Attendance Rate"
          value={`${analytics.attendance.dailyAverage}%`}
          icon={CheckCircle}
          color="green"
          change={`${analytics.attendance.weeklyTrend > 0 ? '+' : ''}${analytics.attendance.weeklyTrend}% this week`}
          changeType={analytics.attendance.weeklyTrend > 0 ? "positive" : "negative"}
          className="hover-lift"
        />
        <StatCard
          title="Active Sessions"
          value={analytics.overview.totalSessions.toLocaleString()}
          icon={Activity}
          color="purple"
          change="+8.3% from yesterday"
          changeType="positive"
          className="hover-lift"
        />
        <StatCard
          title="Avg Session Time"
          value={analytics.overview.avgSessionTime}
          icon={Clock}
          color="orange"
          change="+2m 15s improvement"
          changeType="positive"
          className="hover-lift"
        />
      </div>

      {/* Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Attendance Goals
              </span>
              <Badge variant="info">Monthly</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <CircularProgress
                  value={analytics.attendance.dailyAverage}
                  max={analytics.attendance.monthlyGoal}
                  size="xl"
                  color="blue"
                  showLabel
                  strokeWidth={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analytics.attendance.perfectAttendance}
                  </div>
                  <div className="text-sm text-gray-600">Perfect Attendance</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analytics.attendance.streakRecord} days
                  </div>
                  <div className="text-sm text-gray-600">Best Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Page Views</span>
                <span className="text-sm font-bold text-gray-900">
                  {analytics.engagement.pageViews.toLocaleString()}
                </span>
              </div>
              <Progress value={85} color="green" size="sm" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Click-through Rate</span>
                <span className="text-sm font-bold text-gray-900">
                  {analytics.engagement.clickThroughRate}%
                </span>
              </div>
              <Progress value={analytics.engagement.clickThroughRate} color="blue" size="sm" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
                <span className="text-sm font-bold text-gray-900">
                  {analytics.engagement.conversionRate}%
                </span>
              </div>
              <Progress value={analytics.engagement.conversionRate} color="purple" size="sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device & Location Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
              Device Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">Mobile</span>
                </div>
                <span className="text-sm font-bold">{analytics.devices.mobile}%</span>
              </div>
              <Progress value={analytics.devices.mobile} color="blue" size="sm" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Desktop</span>
                </div>
                <span className="text-sm font-bold">{analytics.devices.desktop}%</span>
              </div>
              <Progress value={analytics.devices.desktop} color="green" size="sm" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm font-medium">Tablet</span>
                </div>
                <span className="text-sm font-bold">{analytics.devices.tablet}%</span>
              </div>
              <Progress value={analytics.devices.tablet} color="purple" size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-600" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm font-medium">{location.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{location.users}</span>
                    <div className="w-16">
                      <Progress value={location.percentage} color="green" size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.performance.pageLoadTime}s
              </div>
              <div className="text-sm text-gray-600">Page Load Time</div>
              <div className="mt-2">
                <Progress value={20} color="green" size="sm" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.performance.serverResponse}s
              </div>
              <div className="text-sm text-gray-600">Server Response</div>
              <div className="mt-2">
                <Progress value={15} color="blue" size="sm" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.performance.errorRate}%
              </div>
              <div className="text-sm text-gray-600">Error Rate</div>
              <div className="mt-2">
                <Progress value={analytics.performance.errorRate} color="red" size="sm" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.performance.uptime}%
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="mt-2">
                <Progress value={analytics.performance.uptime} color="green" size="sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
