import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  Calendar, 
  Clock, 
  Users, 
  Award,
  TrendingUp,
  MessageSquare,
  Settings,
  Filter,
  MoreHorizontal
} from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock notifications data
  const mockNotifications = [
    {
      id: 1,
      type: 'attendance',
      title: 'Perfect Attendance Streak!',
      message: 'Congratulations! You\'ve maintained perfect attendance for 15 days straight.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'high',
      icon: Award,
      color: 'green',
      actionable: true,
      actions: [{ label: 'View Stats', action: 'view-stats' }]
    },
    {
      id: 2,
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      priority: 'medium',
      icon: Settings,
      color: 'blue',
      actionable: false
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Check-in Reminder',
      message: 'Don\'t forget to check in for today\'s session. You have 30 minutes remaining.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      read: true,
      priority: 'high',
      icon: Clock,
      color: 'orange',
      actionable: true,
      actions: [{ label: 'Check In Now', action: 'check-in' }]
    },
    {
      id: 4,
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      message: 'You\'ve earned the "Early Bird" badge for consistent early arrivals.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      priority: 'medium',
      icon: Award,
      color: 'purple',
      actionable: true,
      actions: [{ label: 'View Badge', action: 'view-badge' }]
    },
    {
      id: 5,
      type: 'social',
      title: 'Weekly Report Available',
      message: 'Your weekly attendance report is ready for review.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      priority: 'low',
      icon: TrendingUp,
      color: 'blue',
      actionable: true,
      actions: [{ label: 'View Report', action: 'view-report' }]
    },
    {
      id: 6,
      type: 'alert',
      title: 'Attendance Goal Alert',
      message: 'You\'re 5% below your monthly attendance goal. Consider improving consistency.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: false,
      priority: 'high',
      icon: AlertTriangle,
      color: 'red',
      actionable: true,
      actions: [{ label: 'View Plan', action: 'improvement-plan' }]
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 800);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'attendance': return Calendar;
      case 'system': return Settings;
      case 'reminder': return Clock;
      case 'achievement': return Award;
      case 'social': return MessageSquare;
      case 'alert': return AlertTriangle;
      default: return Info;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center">
              <Bell className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-600">
                  {notifications.filter(n => !n.read).length} unread
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark All Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {['all', 'unread', 'attendance', 'system', 'reminder', 'achievement'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => {
                  const IconComponent = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 transition-all duration-200 hover:bg-gray-50 ${
                        !notification.read ? getPriorityColor(notification.priority) : 'border-l-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.color === 'green' ? 'bg-green-100' :
                          notification.color === 'blue' ? 'bg-blue-100' :
                          notification.color === 'orange' ? 'bg-orange-100' :
                          notification.color === 'purple' ? 'bg-purple-100' :
                          notification.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            notification.color === 'green' ? 'text-green-600' :
                            notification.color === 'blue' ? 'text-blue-600' :
                            notification.color === 'orange' ? 'text-orange-600' :
                            notification.color === 'purple' ? 'text-purple-600' :
                            notification.color === 'red' ? 'text-red-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(notification.timestamp)}
                                </span>
                                <Badge 
                                  variant={notification.priority === 'high' ? 'destructive' : 
                                          notification.priority === 'medium' ? 'warning' : 'default'}
                                  size="sm"
                                >
                                  {notification.priority}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {notification.actionable && notification.actions && (
                            <div className="mt-3 flex space-x-2">
                              {notification.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              className="w-full"
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Notification Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
