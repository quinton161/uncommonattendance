'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import StudentManagement from '@/components/admin/StudentManagement';
import InlineSpinner from '@/components/ui/InlineSpinner';
import { Users, Search, Filter } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
  attendanceStats: {
    totalDays: number;
    completedDays: number;
    attendanceRate: number;
  };
}

export default function StudentsPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }

    if (user && token) {
      fetchStudents();
    }
  }, [user, loading, token, router, searchTerm, filterActive]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterActive !== null) params.append('isActive', filterActive.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/students?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <InlineSpinner size="lg" color="blue" text="Loading Students..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="mt-2 text-gray-600">View and manage all registered students</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterActive === null ? 'all' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Students</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Management Component */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <InlineSpinner size="lg" color="blue" text="Loading student data..." />
          </div>
        ) : (
          <StudentManagement 
            students={students} 
            onStudentUpdate={fetchStudents}
            token={token!}
          />
        )}
      </main>
    </div>
  );
}
