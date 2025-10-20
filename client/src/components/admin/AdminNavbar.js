import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react';

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [lateStudents, setLateStudents] = useState([]);
  const [loadingLate, setLoadingLate] = useState(false);
  const [earlyStudents, setEarlyStudents] = useState([]);
  const { user, logout } = useAuth();
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
    setIsNotifOpen(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileOpen(false);
      setIsNotifOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch early/late students (admin only)
  useEffect(() => {
    if (user?.role !== 'admin' || !token) return;
    let intervalId;
    const fetchLists = async () => {
      try {
        setLoadingLate(true);
        const [late, early] = await Promise.all([
          apiService.getLateToday(token),
          apiService.getEarlyToday(token)
        ]);
        setLateStudents(late);
        setEarlyStudents(early);
      } catch (e) {
        // silent fail on navbar
      } finally {
        setLoadingLate(false);
      }
    };
    fetchLists();
    intervalId = setInterval(fetchLists, 60_000);
    return () => clearInterval(intervalId);
  }, [user?.role, token]);

  const handleSendWarning = async (student, message = 'You arrived late today. Please be on time.') => {
    try {
      await apiService.sendLateWarning(student.userId._id, message, token);
      toast.success(`Warning sent to ${student.userId.name}`);
    } catch (e) {
      toast.error(e.message || 'Failed to send warning');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Attendance', href: '/admin/attendance', icon: Calendar },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/admin/dashboard" className="flex items-center group">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <span className="text-white font-bold text-lg">U</span>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      Uncommon
                    </div>
                    <div className="text-xs text-gray-500 -mt-1">Attendance</div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side - Actions & User Menu */}
          <div className="hidden md:ml-4 md:flex md:items-center md:space-x-3">
            {/* Search */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotifOpen(!isNotifOpen);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative"
              >
                <Bell className="w-5 h-5" />
                {((lateStudents?.length || 0) + (earlyStudents?.length || 0)) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full flex items-center justify-center">
                    {(lateStudents?.length || 0) + (earlyStudents?.length || 0)}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">Notifications</div>
                    {loadingLate && <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {/* Early section */}
                    <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Early today</div>
                    {(earlyStudents?.length || 0) === 0 ? (
                      <div className="px-4 py-2 text-xs text-gray-400">No early arrivals</div>
                    ) : (
                      earlyStudents.map((rec) => (
                        <div key={`early-${rec._id}`} className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                            {rec.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{rec.userId?.name}</div>
                            <div className="text-xs text-gray-500 truncate">Checked in early at {rec.checkInTime}</div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Late section */}
                    <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Late today</div>
                    {(lateStudents?.length || 0) === 0 ? (
                      <div className="px-4 py-2 text-xs text-gray-400">No late students today</div>
                    ) : (
                      lateStudents.map((rec) => (
                        <div key={`late-${rec._id}`} className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                            {rec.userId?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{rec.userId?.name}</div>
                            <div className="text-xs text-gray-500 truncate">Checked in late at {rec.checkInTime}</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendWarning(rec); }}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            Send warning
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="text-right hidden lg:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
                <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                    <div className="text-xs text-blue-600 capitalize mt-1">{user?.role} Account</div>
                  </div>
                  
                  <Link
                    to="/admin/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    View Profile
                  </Link>
                  
                  <Link
                    to="/admin/settings"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-400" />
                    Settings
                  </Link>
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 pt-4 pb-3">
            {/* Mobile User Info */}
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-base font-medium text-gray-900">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <div className="text-xs text-blue-600 capitalize">{user?.role} Account</div>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <div className="pt-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile Profile & Logout */}
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
              <Link
                to="/admin/profile"
                className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                  isActive('/admin/profile')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <User className="w-5 h-5 mr-4" />
                Profile
              </Link>
              
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 mr-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
