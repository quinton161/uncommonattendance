'use client';

import { User, Clock, LogIn, LogOut, Calendar } from 'lucide-react';

interface ActivityItem {
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
  createdAt: string;
}

interface RecentActivityProps {
  recentActivity: ActivityItem[];
}

export default function RecentActivity({ recentActivity }: RecentActivityProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (item: ActivityItem) => {
    if (item.status === 'checked-out') {
      return <LogOut className="h-4 w-4 text-orange-600" />;
    }
    return <LogIn className="h-4 w-4 text-green-600" />;
  };

  const getActivityText = (item: ActivityItem) => {
    if (item.status === 'checked-out') {
      return `checked out at ${item.checkOutTime}`;
    }
    return `checked in at ${item.checkInTime}`;
  };

  const getActivityColor = (item: ActivityItem) => {
    if (item.status === 'checked-out') {
      return 'border-orange-200 bg-orange-50';
    }
    return 'border-green-200 bg-green-50';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Last 7 days</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Recent Activity
            </h3>
            <p className="text-gray-600">
              Recent check-ins and check-outs will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.map((item) => (
              <div key={`${item._id}-${item.status}`} className={`flex items-center space-x-3 p-3 rounded-lg border ${getActivityColor(item)}`}>
                {item.userId.profilePicture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${item.userId.profilePicture}`}
                    alt={item.userId.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getActivityIcon(item)}
                    <p className="text-sm font-medium text-gray-900">
                      {item.userId.name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getActivityText(item)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {recentActivity.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All Activity →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
