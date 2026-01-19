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
import { DirectAuthTest } from './components/Auth/DirectAuthTest';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { ToastContainer } from 'react-toastify';
import { uniqueToast } from './utils/toastUtils';
import DataService from './services/DataService';
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
  const [showAuthTest, setShowAuthTest] = useState(false);

  useEffect(() => {
    // Add keyboard shortcut to show auth test (Ctrl+Shift+T)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setShowAuthTest(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Test Firebase connection on app startup (delayed to ensure Firebase is initialized)
    const initializeBackend = async () => {
      console.log('App initialized with Firebase configuration');
      
      try {
        // Add a small delay to ensure Firebase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dataService = DataService.getInstance();
        const isConnected = await dataService.testConnection();
        
        if (isConnected) {
          console.log('✅ Backend connection successful');
        } else {
          console.warn('⚠️ Backend connection failed, using offline mode');
        }
      } catch (error) {
        console.error('❌ Backend initialization error:', error);
        // Don't show error toast immediately as it might interfere with auth
        console.warn('Backend connection will be retried when needed');
      }
    };
    
    // Delay initialization to avoid interfering with auth
    const timer = setTimeout(initializeBackend, 2000);
    
    // Set up periodic cleanup of old toast entries
    const cleanupInterval = setInterval(() => {
      uniqueToast.cleanup();
    }, 60000); // Clean up every minute
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timer);
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
      {showAuthTest && <DirectAuthTest />}
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
