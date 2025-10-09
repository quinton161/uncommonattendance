'use client';

import { User, Clock, MapPin, Users } from 'lucide-react';

interface Student {
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  checkInTime: string;
  checkInLocation: {
    lat: number;
    lng: number;
  };
  status: string;
  isLate?: boolean;
}

interface LiveAttendanceProps {
  currentlyCheckedIn: Student[];
  todayAttendance: Student[];
}

export default function LiveAttendance({ currentlyCheckedIn, todayAttendance }: LiveAttendanceProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Live Attendance</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{currentlyCheckedIn.length} currently present</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {currentlyCheckedIn.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Students Currently Present
            </h3>
            <p className="text-gray-600">
              Students who are checked in will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700 mb-4">
              Currently Checked In ({currentlyCheckedIn.length})
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentlyCheckedIn.map((student) => (
                <div key={student.userId._id} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  student.isLate 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  {student.userId.profilePicture ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${student.userId.profilePicture}`}
                      alt={student.userId.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      student.isLate ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <User className={`h-5 w-5 ${student.isLate ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.userId.name}
                        {student.isLate && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            LATE
                          </span>
                        )}
                      </p>
                      <div className={`flex items-center text-xs ${
                        student.isLate ? 'text-red-700' : 'text-green-700'
                      }`}>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{student.checkInTime}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{student.userId.email}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>
                        {student.checkInLocation.lat.toFixed(4)}, {student.checkInLocation.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Today's Summary
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">{todayAttendance.length}</div>
              <div className="text-xs text-blue-700">Total Check-ins</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">{currentlyCheckedIn.length}</div>
              <div className="text-xs text-green-700">Still Present</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
