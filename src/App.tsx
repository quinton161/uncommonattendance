import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { AuthPage } from './components/Auth/AuthPage';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { ProfilePage } from './components/Student/ProfilePage';
import { SimpleSplash } from './components/Common/SimpleSplash';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { ToastContainer } from 'react-toastify';
import { uniqueToast } from './utils/toastUtils';
import DataService from './services/DataService';
import './utils/attendanceVerification'; // Import attendance verification tools
import 'react-toastify/dist/ReactToastify.css';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard');

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: theme.colors.textSecondary
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Handle navigation based on user type
  if (user.userType === 'attendee') {
    if (currentPage === 'profile') {
      return (
        <ProfilePage onBack={() => setCurrentPage('dashboard')} />
      );
    }
    return <StudentDashboard onNavigateToProfile={() => setCurrentPage('profile')} />;
  }

  // Organizer and Admin dashboard
  if (user.userType === 'organizer' || user.userType === 'admin') {
    if (currentPage === 'profile') {
      return (
        <ProfilePage onBack={() => setCurrentPage('dashboard')} />
      );
    }
    return <AdminDashboard onNavigateToProfile={() => setCurrentPage('profile')} />;
  }

  // Fallback for unknown roles
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h1>Welcome, {user.displayName}!</h1>
      <p>User Type: {user.userType}</p>
      <p>Unknown state - please contact administrator</p>
    </div>
  );
};

const AppWithProviders: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <EventProvider user={user}>
      <Router>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
    </EventProvider>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Test Firebase connection on app startup
    const initializeBackend = async () => {
      console.log('App initialized with Firebase configuration');
      
      try {
        const dataService = DataService.getInstance();
        const isConnected = await dataService.testConnection();
        
        if (isConnected) {
          console.log('✅ Backend connection successful');
        } else {
          console.warn('⚠️ Backend connection failed, using offline mode');
        }
      } catch (error) {
        console.error('❌ Backend initialization error:', error);
        uniqueToast.error('Backend connection failed. Using offline mode.', { autoClose: 5000 });
      }
    };
    
    initializeBackend();
    
    // Set up periodic cleanup of old toast entries
    const cleanupInterval = setInterval(() => {
      uniqueToast.cleanup();
    }, 60000); // Clean up every minute
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      {showSplash ? (
        <SimpleSplash onFinish={handleSplashFinish} duration={2000} />
      ) : (
        <AuthProvider>
          <AppWithProviders />
        </AuthProvider>
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          backgroundColor: theme.colors.white,
          color: theme.colors.textPrimary,
          border: `1px solid ${theme.colors.primary}`,
        }}
      />
    </ThemeProvider>
  );
}

export default App;
