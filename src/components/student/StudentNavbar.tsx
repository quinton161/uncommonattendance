'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Clock, History } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function StudentNavbar() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                <svg 
                  width="160" 
                  height="40" 
                  viewBox="0 0 174 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <text 
                    x="0" 
                    y="24" 
                    fontFamily="Chillax, system-ui, -apple-system, sans-serif" 
                    fontSize="24" 
                    fontWeight="600" 
                    fill="#0647a1"
                  >
                    uncommon
                  </text>
                </svg>
                <span className="text-sm text-gray-500">Attendance System</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/student/dashboard"
                className="text-uncommon-blue hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50"
              >
                Dashboard
              </Link>
              <Link
                href="/student/history"
                className="text-gray-600 hover:text-uncommon-blue px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200 hover:bg-blue-50"
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Link>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {user?.profilePicture ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profilePicture}`}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
              )}
              <span className="hidden md:block text-gray-700 font-medium">{user?.name}</span>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  
                  <Link
                    href="/student/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/student/dashboard"
            className="text-indigo-600 hover:text-indigo-800 block px-3 py-2 rounded-md text-base font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/student/history"
            className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium flex items-center"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
