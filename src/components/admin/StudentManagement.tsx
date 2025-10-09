'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  MoreVertical,
  CheckSquare,
  Square,
  Users,
  AlertTriangle
} from 'lucide-react';

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

interface StudentManagementProps {
  students: Student[];
  onStudentUpdate: () => void;
  token: string;
}

export default function StudentManagement({ students, onStudentUpdate, token }: StudentManagementProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Handle individual student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle select all/none
  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s._id));
    }
  };

  // Update student
  const handleUpdateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        onStudentUpdate();
        setEditingStudent(null);
      } else {
        toast.error(data.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Update student error:', error);
      toast.error('Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete student (permanent deletion)
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this student? This action cannot be undone and will remove all their data including attendance records.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/students/${studentId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        onStudentUpdate();
      } else {
        toast.error(data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error('Failed to delete student');
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students first');
      return;
    }

    const actionText = action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'permanently delete';
    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to permanently delete ${selectedStudents.length} student(s)? This action cannot be undone and will remove all their data including attendance records.`
      : `Are you sure you want to ${actionText} ${selectedStudents.length} student(s)?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/students/bulk-action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          studentIds: selectedStudents
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setSelectedStudents([]);
        setShowBulkActions(false);
        onStudentUpdate();
      } else {
        toast.error(data.message || `Failed to ${actionText} students`);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(`Failed to ${actionText} students`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedStudents.length} student(s) selected
              </span>
              <button
                onClick={() => setSelectedStudents([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={isLoading}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                title="Permanently delete selected students"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Students ({students.length})
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                {selectedStudents.length === students.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>Select All</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === students.length && students.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudentSelection(student._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.profilePicture ? (
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}${student.profilePicture}`}
                          alt={student.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.attendanceStats.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.attendanceStats.totalDays} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <UserX className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit student"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateStudent(student._id, { isActive: !student.isActive })}
                        className={`${student.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        title={student.isActive ? 'Deactivate student' : 'Activate student'}
                        disabled={isLoading}
                      >
                        {student.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Permanently delete student"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">No students match your current filters.</p>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Student</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateStudent(editingStudent._id, {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  isActive: formData.get('isActive') === 'true'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingStudent.name}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingStudent.email}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="isActive"
                    defaultValue={editingStudent.isActive.toString()}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
