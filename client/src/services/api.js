const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
});

const apiService = {
  // Attendance (student)
  async getAttendanceStatus(token) {
    const res = await fetch(`${API_BASE_URL}/api/attendance/status`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch status');
    return data;
  },

  async getAttendanceHistory({ page = 1, limit = 7, startDate, endDate } = {}, token) {
    const params = new URLSearchParams({ page, limit });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`${API_BASE_URL}/api/attendance/history?${params.toString()}`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch history');
    return data.data;
  },

  async getAttendanceStats(token) {
    // Derive from history endpoint (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 89);
    const toStr = (d) => d.toISOString().split('T')[0];
    const history = await this.getAttendanceHistory({ limit: 90, startDate: toStr(startDate), endDate: toStr(endDate) }, token);
    const records = history.attendance || [];
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status !== 'absent').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    return { totalDays, presentDays, absentDays, attendanceRate };
  },

  async checkIn(location, notes = '', token) {
    console.log('🌐 API checkIn called with:', { location, notes, token: token ? 'present' : 'missing' });
    console.log('🔗 API URL:', `${API_BASE_URL}/api/attendance/check-in`);
    
    const requestBody = { location, notes };
    console.log('📤 Request body:', requestBody);
    
    const res = await fetch(`${API_BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 Response status:', res.status, res.statusText);
    
    const data = await res.json();
    console.log('📥 Response data:', data);
    
    if (!res.ok) {
      console.error('❌ API Error:', data);
      throw new Error(data.message || 'Check-in failed');
    }
    return data.data;
  },

  async checkOut(location, notes = '', token) {
    console.log('🌐 API checkOut called with:', { location, notes, token: token ? 'present' : 'missing' });
    console.log('🔗 API URL:', `${API_BASE_URL}/api/attendance/check-out`);
    
    const requestBody = { location, notes };
    console.log('📤 Request body:', requestBody);
    
    const res = await fetch(`${API_BASE_URL}/api/attendance/check-out`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 Response status:', res.status, res.statusText);
    
    const data = await res.json();
    console.log('📥 Response data:', data);
    
    if (!res.ok) {
      console.error('❌ API Error:', data);
      throw new Error(data.message || 'Check-out failed');
    }
    return data.data;
  },

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location services not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error('Location permission denied')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  // Admin: Students
  async listStudents({ page = 1, limit = 20, search, isActive } = {}, token) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (typeof isActive === 'boolean') params.set('isActive', String(isActive));
    const res = await fetch(`${API_BASE_URL}/api/admin/students?${params.toString()}`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
    return data.data;
  },

  async deleteStudent(studentId, { permanent = true } = {}, token) {
    const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}?permanent=${permanent}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Delete failed:', res.status, data);
      throw new Error(data.message || `Failed to delete student (${res.status})`);
    }
    return data;
  },

  async addStudent({ name, email, password, role = 'student' }, token) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add student');
    return data.data;
  },

  async updateStudent(studentId, updates, token) {
    const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Update failed:', res.status, data);
      throw new Error(data.message || `Failed to update student (${res.status})`);
    }
    return data.data;
  },

  async createStudent({ name, email, password, role = 'student' }, token) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token) },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create student');
    return data.data;
  },

  async getLateToday(token) {
    const res = await fetch(`${API_BASE_URL}/api/admin/attendance/late-today`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch late students');
    return data.data.late || [];
  },

  async sendLateWarning(userId, message, token) {
    const res = await fetch(`${API_BASE_URL}/api/admin/notifications/warn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
      body: JSON.stringify({ userId, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send warning');
    return data;
  },

  async getEarlyToday(token) {
    const res = await fetch(`${API_BASE_URL}/api/admin/attendance/early-today`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch early students');
    return data.data.early || [];
  },

  // Admin: Attendance
  async getAdminAttendance(params = {}, token) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/admin/attendance${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch attendance data');
    return data.data;
  },

  // Admin: Reports
  async getAdminReports(params = {}, token) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/admin/reports/attendance-summary${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch reports');
    return data.data;
  },

  // Admin: Export Reports
  async exportAttendanceReport(params = {}, token) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/admin/attendance/export${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders(token) }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to export report');
    }
    return res.blob(); // Return blob for file download
  },

  // Admin: System Stats (using dashboard endpoint)
  async getSystemStats(token) {
    const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch system stats');
    return data.data;
  },

  // Admin: Recent Activity (mock data for now)
  async getRecentActivity(token) {
    // Since there's no specific endpoint, return mock data
    // This could be enhanced later with a real endpoint
    return {
      activities: [
        {
          id: 1,
          description: 'New user registration',
          user: 'John Doe',
          timestamp: '2 minutes ago',
          type: 'success'
        },
        {
          id: 2,
          description: 'Attendance check-in',
          user: 'Jane Smith',
          timestamp: '5 minutes ago',
          type: 'info'
        },
        {
          id: 3,
          description: 'System backup completed',
          user: 'System',
          timestamp: '1 hour ago',
          type: 'success'
        }
      ]
    };
  },

  // User: Stats
  async getUserStats(token) {
    const res = await fetch(`${API_BASE_URL}/api/user/stats`, {
      headers: { ...getAuthHeaders(token) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch user stats');
    return data.data;
  }
};

export default apiService;
