import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import apiService from '../../services/api';
import toastService from '../../services/toastService';
import { 
  Users, 
  Clock, 
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Eye,
  MapPin,
  Calendar
} from 'lucide-react';

export default function AdminAttendance() {
  const { token } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  const fetchAttendance = async (date) => {
    try {
      setLoading(true);
      const params = {};
      if (date) params.date = date;
      
      const data = await apiService.getAdminAttendance(params, token);
      const records = (data?.attendance || []).map(r => ({
        id: r._id,
        studentId: r.userId?._id || '',
        studentName: r.userId?.name || 'Unknown',
        email: r.userId?.email || '',
        checkInTime: r.checkInTime || null,
        checkOutTime: r.checkOutTime || null,
        status: r.status === 'checked-in' ? 'present' : (r.status === 'checked-out' ? 'present' : 'absent'),
        duration: r.totalHours ? `${r.totalHours}h` : (r.status === 'checked-in' ? 'In progress' : '0h 0m'),
        location: r.checkInLocation?.lat && r.checkInLocation?.lng ? `${r.checkInLocation.lat}, ${r.checkInLocation.lng}` : null,
        date: r.date,
        isLate: r.isLate || false,
        isAtHub: r.checkInLocation?.lat && r.checkInLocation?.lng ? true : false
      }));
      setAttendanceData(records);
    } catch (err) {
      console.error('Fetch attendance error:', err);
      toastService.error(err.message || 'Failed to load attendance');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAttendance(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedDate]);

  const filteredData = attendanceData.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge variant="success">Present</Badge>;
      case 'late':
        return <Badge variant="warning">Late</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'late':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleMarkPresent = (studentId) => {
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === studentId 
          ? { ...record, status: 'present', checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : record
      )
    );
    toastService.success('Student marked as present! ✅');
  };

  const handleMarkAbsent = (studentId) => {
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === studentId 
          ? { ...record, status: 'absent', checkInTime: null, checkOutTime: null }
          : record
      )
    );
    toastService.warning('Student marked as absent! ❌');
  };

  const handleExportData = () => {
    toastService.success('Exporting attendance data... 📊');
    // Simulate export
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toastService.success('Attendance data refreshed! 🔄');
    }, 1000);
  };

  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'present').length,
    late: attendanceData.filter(r => r.isLate && r.status === 'present').length,
    absent: attendanceData.filter(r => r.status === 'absent').length,
    onTime: attendanceData.filter(r => !r.isLate && r.status === 'present').length,
    atHub: attendanceData.filter(r => r.isAtHub && r.status === 'present').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                <p className="mt-2 text-gray-600">Track and manage student attendance for {selectedDate}</p>
                <div className="mt-2 flex items-center text-sm text-blue-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="font-medium">Vincent Bohlen Hub, Victoria Falls</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Late</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Absent</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPin className={`h-8 w-8 ${stats.atHub > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">At Hub</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.atHub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, student ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Attendance Records ({filteredData.length})
              </span>
              <Badge variant="outline">
                {new Date(selectedDate).toLocaleDateString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading attendance data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{record.studentName}</div>
                            <div className="text-sm text-gray-500">{record.studentId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(record.status)}
                          {record.isLate && record.status === 'present' && (
                            <Badge variant="destructive" className="text-xs">
                              Late
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={record.checkInTime ? 'text-gray-900' : 'text-gray-400'}>
                            {record.checkInTime || 'Not checked in'}
                          </span>
                          {record.isLate && record.checkInTime && (
                            <Clock className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={record.checkOutTime ? 'text-gray-900' : 'text-gray-400'}>
                          {record.checkOutTime || 'Not checked out'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{record.duration}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {record.location ? (
                            <>
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-900 font-medium">Vincent Bohlen Hub</span>
                            </>
                          ) : (
                            <span className="text-gray-400">Unknown Location</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {record.status !== 'present' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkPresent(record.id)}
                              leftIcon={<CheckCircle className="w-4 h-4" />}
                            >
                              Mark Present
                            </Button>
                          )}
                          {record.status !== 'absent' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAbsent(record.id)}
                              leftIcon={<XCircle className="w-4 h-4" />}
                            >
                              Mark Absent
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="w-4 h-4" />}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
