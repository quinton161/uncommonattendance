import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentNavbar from '../../components/student/StudentNavbar';
import LoadingScreen from '../../components/ui/LoadingScreen';
import apiService from '../../services/api';
import toastService from '../../services/toastService';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Award, 
  MapPin,
  Activity,
  BarChart3,
  Users,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, token, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null); // 'valid', 'invalid', 'checking'

  // Vincent Bohlen Hub coordinates at Chamabondo Primary School, Mkhosana Township, Victoria Falls
  const HUB_LOCATION = {
    lat: -17.93814, // Mkhosana Township, Victoria Falls, Zimbabwe
    lng: 25.81989,
    radius: 500 // 500 meters radius (increased for GPS accuracy)
  };

  // Temporary bypass for testing (set to true to disable location validation)
  const BYPASS_LOCATION_CHECK = false;

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Check if current location is within hub radius
  const validateLocation = (currentLat, currentLng) => {
    const distance = calculateDistance(
      currentLat, currentLng,
      HUB_LOCATION.lat, HUB_LOCATION.lng
    );
    return distance <= HUB_LOCATION.radius;
  };

  // Check if current time is after 9 AM
  const isLateArrival = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    return hour > 9 || (hour === 9 && minute > 0);
  };

  // Check if current day is a weekday (Monday-Friday)
  const isWeekday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) to Friday (5)
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [statusResponse, historyResponse, statsResponse] = await Promise.all([
        apiService.getAttendanceStatus(token),
        apiService.getAttendanceHistory({ limit: 7 }, token),
        apiService.getUserStats(token)
      ]);

      const currentAttendance = statusResponse.data.attendance;
      const stats = statsResponse || {};

      setDashboardData({
        isCheckedIn: currentAttendance?.status === 'checked-in',
        checkInTime: currentAttendance?.checkInTime,
        checkOutTime: currentAttendance?.checkOutTime,
        totalDays: stats.totalDays || 0,
        presentDays: stats.presentDays || 0,
        attendanceRate: stats.attendanceRate || 0,
        currentStreak: stats.currentStreak || 0,
        weeklyAttendance: stats.weeklyAttendance || 0,
        monthlyGoal: 90,
        recentActivity: historyResponse.attendance?.slice(0, 5) || [],
        isLate: currentAttendance?.isLate || false,
        weeklyLateCount: stats.weeklyLateCount || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toastService.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    console.log('🔄 Starting check-in process...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      toastService.error('Geolocation is not supported by this browser');
      return;
    }

    setIsCheckingIn(true);
    setLocationStatus('checking');
    const toastId = toastService.loading('Getting your location...');

    try {
      console.log('📍 Getting GPS position...');
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 0 // Force fresh GPS reading
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log('📍 Current location:', location);
      console.log('🎯 GPS accuracy:', position.coords.accuracy, 'meters');
      console.log('🏢 Hub location:', HUB_LOCATION);
      
      // Show accuracy warning if GPS is not very accurate
      if (position.coords.accuracy > 100) {
        console.warn('⚠️ GPS accuracy is low:', position.coords.accuracy, 'meters');
        toastService.update(toastId, `GPS accuracy: ${Math.round(position.coords.accuracy)}m - Getting better location...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Validate location
      const distance = calculateDistance(location.lat, location.lng, HUB_LOCATION.lat, HUB_LOCATION.lng);
      const isAtHub = distance <= HUB_LOCATION.radius;
      const isLate = isLateArrival() && isWeekday(); // Only consider late on weekdays
      
      console.log(`📏 Distance to hub: ${distance.toFixed(2)}m (limit: ${HUB_LOCATION.radius}m)`);
      console.log(`✅ At hub: ${isAtHub}`);
      console.log(`⏰ Is late: ${isLate}`);
      console.log(`📅 Is weekday: ${isWeekday()}`);

      if (!isAtHub && !BYPASS_LOCATION_CHECK) {
        console.log('❌ Location validation failed - not at hub');
        setLocationStatus('invalid');
        const accuracyNote = position.coords.accuracy > 50 ? ` (GPS accuracy: ${Math.round(position.coords.accuracy)}m)` : '';
        toastService.update(toastId, `⚠️ You are ${distance.toFixed(0)}m away from Vincent Bohlen Hub! Please move closer (within ${HUB_LOCATION.radius}m)${accuracyNote}`, 'error');
        return;
      }

      if (BYPASS_LOCATION_CHECK) {
        console.log('⚠️ Location validation bypassed for testing');
      }

      setLocationStatus('valid');
      console.log('✅ Location validation passed');

      // Check if it's weekend
      if (!isWeekday()) {
        console.log('📅 Weekend check-in detected');
        toastService.update(toastId, 'ℹ️ Weekend check-in - No attendance tracking required', 'info');
        // Wait 2 seconds to show the info, then proceed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Show late warning if applicable (weekdays only)
      if (isLate) {
        console.log('⏰ Late arrival detected');
        toastService.update(toastId, '⏰ You are checking in late! Lessons start at 9:00 AM', 'warning');
        // Wait 2 seconds to show the warning, then proceed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('🚀 Sending check-in request to API...');
      toastService.update(toastId, 'Checking you in...', 'loading');
      const response = await apiService.checkIn(location, '', token);
      
      console.log('✅ Check-in API response:', response);
      console.log('📋 Response structure check:', {
        hasAttendance: !!response.attendance,
        attendanceKeys: response.attendance ? Object.keys(response.attendance) : 'none',
        checkInTime: response.attendance?.checkInTime,
        status: response.attendance?.status
      });
      
      setDashboardData(prev => {
        const newData = {
          ...prev,
          isCheckedIn: true,
          checkInTime: response.attendance?.checkInTime || response.checkInTime,
          isLate: response.attendance?.isLate || response.isLate || false
        };
        console.log('📊 Updated dashboard data:', newData);
        return newData;
      });

      const successMessage = !isWeekday() 
        ? '🎉 Weekend check-in successful!' 
        : isLate 
          ? '🔴 Checked in successfully - You are late!' 
          : '🎉 Successfully checked in!';
      
      console.log('🎉 Check-in successful:', successMessage);
      toastService.update(toastId, successMessage, isLate ? 'warning' : 'success');
      
      // Force refresh dashboard data to ensure UI updates
      console.log('🔄 Refreshing dashboard data after check-in...');
      setTimeout(() => {
        fetchDashboardData();
      }, 1000);
    } catch (error) {
      console.error('❌ Check-in failed:', error);
      let errorMessage = 'Check-in failed. Please try again.';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.message?.includes('already checked in')) {
        errorMessage = 'You are already checked in today.';
      } else if (error.message) {
        errorMessage = `Check-in failed: ${error.message}`;
      }
      
      console.log('📢 Error message:', errorMessage);
      toastService.update(toastId, errorMessage, 'error');
      setLocationStatus(null);
    } finally {
      setIsCheckingIn(false);
      console.log('🏁 Check-in process completed');
    }
  };

  const handleCheckOut = async () => {
    console.log('🔄 Starting check-out process...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      toastService.error('Geolocation is not supported by this browser');
      return;
    }

    setIsCheckingOut(true);
    const toastId = toastService.loading('Getting your location...');

    try {
      console.log('📍 Getting GPS position for check-out...');
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 0 // Force fresh GPS reading
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log('📍 Check-out location:', location);
      console.log('🎯 GPS accuracy:', position.coords.accuracy, 'meters');
      console.log('🏢 Hub location:', HUB_LOCATION);
      
      // Show accuracy warning if GPS is not very accurate
      if (position.coords.accuracy > 100) {
        console.warn('⚠️ GPS accuracy is low:', position.coords.accuracy, 'meters');
        toastService.update(toastId, `GPS accuracy: ${Math.round(position.coords.accuracy)}m - Getting better location...`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Validate location for check-out too
      const distance = calculateDistance(location.lat, location.lng, HUB_LOCATION.lat, HUB_LOCATION.lng);
      const isAtHub = distance <= HUB_LOCATION.radius;
      
      console.log(`📏 Distance to hub: ${distance.toFixed(2)}m (limit: ${HUB_LOCATION.radius}m)`);
      console.log(`✅ At hub for check-out: ${isAtHub}`);

      if (!isAtHub && !BYPASS_LOCATION_CHECK) {
        console.log('❌ Check-out location validation failed - not at hub');
        const accuracyNote = position.coords.accuracy > 50 ? ` (GPS accuracy: ${Math.round(position.coords.accuracy)}m)` : '';
        toastService.update(toastId, `⚠️ You are ${distance.toFixed(0)}m away from Vincent Bohlen Hub! Please move closer to check out (within ${HUB_LOCATION.radius}m)${accuracyNote}`, 'error');
        return;
      }

      if (BYPASS_LOCATION_CHECK) {
        console.log('⚠️ Check-out location validation bypassed for testing');
      }

      console.log('🚀 Sending check-out request to API...');
      toastService.update(toastId, 'Checking you out...', 'loading');
      const response = await apiService.checkOut(location, '', token);
      
      console.log('✅ Check-out API response:', response);
      console.log('📋 Check-out response structure check:', {
        hasAttendance: !!response.attendance,
        attendanceKeys: response.attendance ? Object.keys(response.attendance) : 'none',
        checkOutTime: response.attendance?.checkOutTime,
        status: response.attendance?.status
      });
      
      let sessionSummary = null;
      
      setDashboardData(prev => {
        const newData = {
          ...prev,
          isCheckedIn: false,
          checkOutTime: response.attendance?.checkOutTime || response.checkOutTime,
          // Keep the check-in time and late status
          checkInTime: prev.checkInTime,
          isLate: prev.isLate
        };
        
        // Calculate session duration if we have both times
        if (prev.checkInTime && response.attendance?.checkOutTime) {
          const checkIn = new Date(prev.checkInTime);
          const checkOut = new Date(response.attendance.checkOutTime);
          const duration = Math.round((checkOut - checkIn) / (1000 * 60)); // minutes
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          sessionSummary = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
        
        console.log('📊 Updated dashboard data after check-out:', newData);
        return newData;
      });

      console.log('🎉 Check-out successful');
      
      const checkoutMessage = sessionSummary 
        ? `Successfully checked out! 👋 Session duration: ${sessionSummary}. Have a great day!`
        : 'Successfully checked out! 👋 Have a great day!';
        
      toastService.update(toastId, checkoutMessage, 'success');
      
      // Force refresh dashboard data to ensure UI updates
      console.log('🔄 Refreshing dashboard data after check-out...');
      setTimeout(() => {
        fetchDashboardData();
      }, 1000);
    } catch (error) {
      console.error('❌ Check-out failed:', error);
      let errorMessage = 'Check-out failed. Please try again.';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.message?.includes('No check-in record')) {
        errorMessage = 'You need to check in first before checking out.';
      } else if (error.message) {
        errorMessage = `Check-out failed: ${error.message}`;
      }
      
      console.log('📢 Check-out error message:', errorMessage);
      toastService.update(toastId, errorMessage, 'error');
    } finally {
      setIsCheckingOut(false);
      console.log('🏁 Check-out process completed');
    }
  };

  if (loading || isLoading) {
    return <LoadingScreen />;
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Welcome back, {user?.name}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Check-in/Check-out Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${
                dashboardData?.isCheckedIn ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {dashboardData?.isCheckedIn ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Clock className="h-8 w-8 text-blue-600" />
                )}
              </div>
              
              <h3 className="mt-4 text-lg leading-6 font-medium text-gray-900">
                {dashboardData?.isCheckedIn ? 'You are checked in!' : 'Ready to check in?'}
              </h3>
              
              <p className="mt-2 text-sm text-gray-500">
                {dashboardData?.isCheckedIn 
                  ? `Checked in at ${formatTime(dashboardData?.checkInTime)}`
                  : 'Click the button below to mark your attendance for today'
                }
              </p>
              
              {!dashboardData?.isCheckedIn && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                    <span className="font-medium">Location: Vincent Bohlen Hub</span>
                  </div>
                  
                  {/* Location Status Indicator */}
                  {locationStatus && (
                    <div className={`flex items-center justify-center text-sm px-3 py-2 rounded-md ${
                      locationStatus === 'checking' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      locationStatus === 'valid' ? 'bg-green-50 text-green-700 border border-green-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {locationStatus === 'checking' && (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                          Checking location...
                        </>
                      )}
                      {locationStatus === 'valid' && (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          At Vincent Bohlen Hub ✓
                        </>
                      )}
                      {locationStatus === 'invalid' && (
                        <>
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Not at Vincent Bohlen Hub!
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Late Arrival Warning - Only on weekdays */}
                  {isLateArrival() && isWeekday() && !dashboardData?.isCheckedIn && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            ⚠️ You are arriving late!
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Lessons start at 9:00 AM. Please arrive on time next weekday.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Weekend Notice */}
                  {!isWeekday() && !dashboardData?.isCheckedIn && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Weekend - No attendance required
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Attendance tracking is only active Monday through Friday.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 space-y-3">
                {/* Debug info */}
                {console.log('🎯 Current dashboard state:', { 
                  isCheckedIn: dashboardData?.isCheckedIn, 
                  checkInTime: dashboardData?.checkInTime,
                  dashboardData: dashboardData 
                })}
                
                {!dashboardData?.isCheckedIn ? (
                  <>
                    <button
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isCheckingIn ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                        Check In Now
                      </>
                    )}
                    </button>
                    
                    {/* Debug button - remove in production */}
                    <button
                      onClick={() => {
                        console.log('🔧 Debug: Toggling check-in state');
                        setDashboardData(prev => ({
                          ...prev,
                          isCheckedIn: !prev?.isCheckedIn,
                          checkInTime: prev?.isCheckedIn ? null : new Date().toISOString()
                        }));
                      }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      🔧 Debug: Toggle State
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCheckOut}
                    disabled={isCheckingOut}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Checking Out...
                      </>
                    ) : (
                      <>
                        <XCircle className="-ml-1 mr-2 h-5 w-5" />
                        Check Out
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Active Session Indicator */}
              {dashboardData?.isCheckedIn && (
                <div className={`mt-4 border rounded-md p-4 ${
                  dashboardData?.isLate 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {dashboardData?.isLate ? (
                        <Clock className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        dashboardData?.isLate ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {dashboardData?.isLate 
                          ? `🔴 Late check-in at ${formatTime(dashboardData?.checkInTime)}`
                          : `Active session since ${formatTime(dashboardData?.checkInTime)}`
                        }
                      </p>
                      {dashboardData?.isLate && (
                        <p className="text-xs text-red-600 mt-1">
                          You checked in after 9:00 AM. Please arrive on time tomorrow.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Completed Session Indicator */}
              {!dashboardData?.isCheckedIn && dashboardData?.checkInTime && dashboardData?.checkOutTime && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        ✅ Session completed today
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {formatTime(dashboardData.checkInTime)} - {formatTime(dashboardData.checkOutTime)}
                        {(() => {
                          const checkIn = new Date(dashboardData.checkInTime);
                          const checkOut = new Date(dashboardData.checkOutTime);
                          const duration = Math.round((checkOut - checkIn) / (1000 * 60));
                          const hours = Math.floor(duration / 60);
                          const minutes = duration % 60;
                          const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                          return ` • Duration: ${durationStr}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Days */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Days</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.totalDays || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Present Days */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Present Days</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardData?.presentDays || 0}</dd>
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
                  <TrendingUp className="h-6 w-6 text-blue-400" />
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

          {/* Weekly Late Arrivals */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className={`h-6 w-6 ${
                    (dashboardData?.weeklyLateCount || 0) >= 5 ? 'text-red-500' : 
                    (dashboardData?.weeklyLateCount || 0) >= 3 ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Late This Week</dt>
                    <dd className={`text-lg font-medium ${
                      (dashboardData?.weeklyLateCount || 0) >= 5 ? 'text-red-600' : 
                      (dashboardData?.weeklyLateCount || 0) >= 3 ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {dashboardData?.weeklyLateCount || 0}/5 weekdays
                      {(dashboardData?.weeklyLateCount || 0) >= 5 && (
                        <span className="text-xs text-red-500 block">⚠️ Limit reached!</span>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Monthly Goal Progress */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Goal Progress</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                  <span>Attendance Goal</span>
                  <span>{dashboardData?.attendanceRate || 0}% / {dashboardData?.monthlyGoal || 90}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((dashboardData?.attendanceRate || 0) / (dashboardData?.monthlyGoal || 90) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {dashboardData?.attendanceRate >= dashboardData?.monthlyGoal 
                  ? '🎉 Congratulations! You\'ve reached your monthly goal!'
                  : `Keep it up! You need ${Math.max(0, (dashboardData?.monthlyGoal || 90) - (dashboardData?.attendanceRate || 0))}% more to reach your goal.`
                }
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
              {dashboardData?.recentActivity?.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {dashboardData.recentActivity.map((activity, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== dashboardData.recentActivity.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.status === 'checked-out' ? 'bg-green-500' : 
                                activity.status === 'checked-in' ? (activity.isLate ? 'bg-red-500' : 'bg-blue-500') : 'bg-gray-500'
                              }`}>
                                {activity.status === 'checked-out' ? (
                                  <CheckCircle className="h-5 w-5 text-white" />
                                ) : activity.status === 'checked-in' ? (
                                  activity.isLate ? <AlertTriangle className="h-5 w-5 text-white" /> : <Clock className="h-5 w-5 text-white" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.status === 'checked-out' ? 'Completed attendance' : 
                                   activity.status === 'checked-in' ? (activity.isLate ? 'Checked in (Late)' : 'Checked in') : 'Absent'}
                                </p>
                                {activity.status === 'checked-in' && activity.isLate && (
                                  <p className="text-xs text-red-600 mt-1">
                                    ⚠️ Arrived after 9:00 AM
                                  </p>
                                )}
                                {activity.checkInTime && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    📍 Vincent Bohlen Hub • {formatTime(activity.checkInTime)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {new Date(activity.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
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
                  <p className="mt-1 text-sm text-gray-500">Start checking in to see your activity here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
