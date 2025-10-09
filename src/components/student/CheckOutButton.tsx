'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, LogOut, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import InlineSpinner from '@/components/ui/InlineSpinner';

interface CheckOutButtonProps {
  onSuccess: () => void;
}

export default function CheckOutButton({ onSuccess }: CheckOutButtonProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleCheckOut = async () => {
    try {
      setIsLoading(true);
      setLocationError('');

      // Get current location
      toast.info('Getting your location...');
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);

      // Send check-out request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/attendance/check-out`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: currentLocation,
          notes: '' // You can add a notes field if needed
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Successfully checked out!');
        onSuccess();
      } else {
        throw new Error(data.message || 'Check-out failed');
      }

    } catch (error: any) {
      console.error('Check-out error:', error);
      setLocationError(error.message);
      toast.error(error.message || 'Check-out failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <LogOut className="h-6 w-6 text-orange-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Ready to Check Out?
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Complete your attendance by checking out when you leave.
        </p>

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
        )}

        {location && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-center text-sm text-green-700">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Location acquired: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleCheckOut}
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <InlineSpinner size="sm" color="white" text="Checking Out..." />
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check Out Now
            </>
          )}
        </button>

        <div className="mt-3 text-xs text-gray-500">
          <div className="flex items-center justify-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span>Location will be recorded for security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
