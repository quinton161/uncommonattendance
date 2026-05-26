import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { AuthPage } from './components/Auth/AuthPage';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { HubSelectGate } from './components/Auth/HubSelectGate';
import { GoogleRegisterGate } from './components/Auth/GoogleRegisterGate';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import { AttendancePage } from './components/Admin/AttendancePage';
import { UsersPage } from './components/Admin/UsersPage';
import { StudentGoalsBoard } from './components/Goals/StudentGoalsBoard';
import { AdminProfile } from './components/Profile/AdminProfile';
import { StudentProfile } from './components/Profile/StudentProfile';
import { MyAttendancePage } from './components/Student/MyAttendancePage';
import { EventsPage } from './components/Events/EventsPage';
import { Layout } from './components/Common/Layout';
import { SimpleSplash } from './components/Common/SimpleSplash';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { DirectAuthTest } from './components/Auth/DirectAuthTest';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { AppUpdateNotifier } from './components/Common/AppUpdateNotifier';
import { ToastContainer } from 'react-toastify';
import { uniqueToast } from './utils/toastUtils';
import DataService from './services/DataService';
import { qrCodeService } from './services/qrCodeService';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: ${theme.colors.textSecondary};
`;

const FallbackScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 16px;
`;

const StyledToastContainer = styled(ToastContainer)`
  z-index: 100000 !important;
`;

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen>
        Loading...
      </LoadingScreen>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.needsProfileCompletion) {
    return <GoogleRegisterGate />;
  }

  const needsHub =
    (user.userType === 'attendee' || user.userType === 'instructor') && !user.hubId;

  if (needsHub) {
    return <HubSelectGate />;
  }

  if (user.userType === 'attendee') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/attendance" element={<MyAttendancePage />} />
          <Route path="/goals" element={<StudentGoalsBoard />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  if (user.userType === 'instructor' || user.userType === 'admin') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route
            path="/goals"
            element={
              <StudentGoalsBoard
                            hubScopeId={undefined}
                            viewAllHubs={user.userType === 'admin' || user.userType === 'instructor'}
              />
            }
          />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  // Fallback for unknown roles
  return (
    <FallbackScreen>
      <h1>Welcome, {user.displayName}!</h1>
      <p>User Type: {user.userType}</p>
      <p>Unknown state - please contact administrator</p>
    </FallbackScreen>
  );
};

const AppWithProviders: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/*"
          element={
            <EventProvider user={user}>
              <AppRoutes />
            </EventProvider>
          }
        />
      </Routes>
    </Router>
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
      try {
        // Add a small delay to ensure Firebase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dataService = DataService.getInstance();
        const isConnected = await dataService.testConnection();
        
        if (isConnected) {
          const existingCode = await qrCodeService.getDailyCode();
          if (!existingCode) {
            await qrCodeService.generateDailyCode();
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.warn('[App] Backend connection failed, offline mode');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[App] Backend initialization:', error);
        }
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
        <ErrorBoundary>
          <AuthProvider>
            <AppUpdateNotifier />
            <AppWithProviders />
          </AuthProvider>
        </ErrorBoundary>
      )}
      {showAuthTest && <DirectAuthTest />}
      <StyledToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="dark"
        limit={4}
      />
    </ThemeProvider>
  );
}

export default App;
