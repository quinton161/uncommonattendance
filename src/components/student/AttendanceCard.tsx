'use client';

import { Clock, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface AttendanceStatus {
  attendance: any;
  date: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  totalHours: number | null;
}

interface AttendanceCardProps {
  attendanceStatus: AttendanceStatus | null;
  onUpdate: () => void;
}

export default function AttendanceCard({ attendanceStatus }: AttendanceCardProps) {
  if (!attendanceStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const { attendance, hasCheckedIn, hasCheckedOut, totalHours } = attendanceStatus;

  const getStatusColor = () => {
    if (!hasCheckedIn) return 'text-gray-500';
    if (hasCheckedOut) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (!hasCheckedIn) return 'Not Checked In';
    if (hasCheckedOut) return 'Checked Out';
    return 'Checked In';
  };

  const getStatusIcon = () => {
    if (!hasCheckedIn) return <XCircle className="h-5 w-5 text-gray-500" />;
    if (hasCheckedOut) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Today's Attendance</h2>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!hasCheckedIn ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to Start Your Day?
            </h3>
            <p className="text-gray-600">
              Check in to mark your attendance for today.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Check-in Information */}
            <div className={`rounded-lg p-4 ${
              attendance.isLate ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${
                  attendance.isLate ? 'text-red-900' : 'text-blue-900'
                }`}>
                  Check-in Details
                  {attendance.isLate && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      LATE - Lessons start at 9:00 AM
                    </span>
                  )}
                </h4>
                <span className={`text-sm ${
                  attendance.isLate ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {attendance.checkInTime}
                </span>
              </div>
              
              <div className={`flex items-center text-sm ${
                attendance.isLate ? 'text-red-700' : 'text-blue-700'
              }`}>
                <MapPin className="h-4 w-4 mr-1" />
                <span>
                  {attendance.checkInLocation.lat.toFixed(4)}, {attendance.checkInLocation.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Check-out Information */}
            {hasCheckedOut && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-green-900">Check-out Details</h4>
                  <span className="text-sm text-green-700">{attendance.checkOutTime}</span>
                </div>
                
                <div className="flex items-center text-sm text-green-700 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {attendance.checkOutLocation.lat.toFixed(4)}, {attendance.checkOutLocation.lng.toFixed(4)}
                  </span>
                </div>

                {totalHours && (
                  <div className="flex items-center text-sm text-green-700">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Total Hours: {totalHours}h</span>
                  </div>
                )}
              </div>
            )}

            {/* Current Status */}
            {!hasCheckedOut && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center text-sm text-yellow-700">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Currently checked in - Don't forget to check out when leaving!</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {attendance.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                <p className="text-sm text-gray-700">{attendance.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Date Information */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date(attendanceStatus.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
