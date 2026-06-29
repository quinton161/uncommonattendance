import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { AuthPage } from './components/Auth/AuthPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import { HubSelectGate } from './components/Auth/HubSelectGate';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import { AttendancePage } from './components/Admin/AttendancePage';
import { UsersPage } from './components/Admin/UsersPage';
import { StaffAccountsPage } from './components/Admin/StaffAccountsPage';
import { AdminProfile } from './components/Profile/AdminProfile';
import { StudentProfile } from './components/Profile/StudentProfile';
import { MyAttendancePage } from './components/Student/MyAttendancePage';
import { Layout } from './components/Common/Layout';
import { SimpleSplash } from './components/Common/SimpleSplash';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { OfflineBanner } from './components/Common/OfflineBanner';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { AppUpdateNotifier } from './components/Common/AppUpdateNotifier';
import { ToastContainer } from 'react-toastify';
import { uniqueToast } from './utils/toastUtils';
import 'react-toastify/dist/ReactToastify.css';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 20px;
  background: linear-gradient(135deg, #001466 0%, #0052CC 60%, #1a7fff 100%);
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingLogo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const LoadingTitle = styled.span`
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const LoadingSubtitle = styled.span`
  color: rgba(255,255,255,0.6);
  font-size: 13px;
`;

const FallbackScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, #001466 0%, #0052CC 60%, #1a7fff 100%);
  padding: 24px;
`;

const FallbackCard = styled.div`
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 40px 32px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;

const StyledToastContainer = styled(ToastContainer)`
  z-index: 100000 !important;
`;

const AppRoutes: React.FC = () => {
  const { user, loading, hubResolved, authError, logout } = useAuth();

  if (loading) {
    return (
      <LoadingScreen>
        <LoadingLogo>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.15)" />
            <path d="M24 12L34 18V30L24 36L14 30V18L24 12Z" fill="white" opacity="0.9" />
          </svg>
          <LoadingTitle>Uncommon Attendance</LoadingTitle>
          <LoadingSubtitle>Loading your session...</LoadingSubtitle>
        </LoadingLogo>
        <LoadingSpinner />
      </LoadingScreen>
    );
  }

  if (authError) {
    return (
      <FallbackScreen>
        <FallbackCard>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#1a1a2e', marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
            Sign-in Error
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 4, fontSize: 14 }}>
            {authError}
          </p>
          <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 13 }}>
            Try signing out and back in. If the problem persists, contact your administrator.
          </p>
          <button
            onClick={() => logout()}
            style={{
              background: 'linear-gradient(135deg, #0052CC, #003D99)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Sign Out
          </button>
        </FallbackCard>
      </FallbackScreen>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Only show HubSelectGate once the Convex profile read has settled (hubResolved).
  // Without this guard, a race condition could show the gate to users who already have a hub.
  const needsHub =
    hubResolved &&
    (user.userType === 'attendee' || user.userType === 'instructor') &&
    !user.hubId;

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
          <Route path="/staff" element={<StaffAccountsPage />} />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    );
  }

  // Fallback for unknown roles — styled with sign-out
  return (
    <FallbackScreen>
      <FallbackCard>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
          Unknown Account State
        </h2>
        <p style={{ color: '#6b7280', marginBottom: 4, fontSize: 14 }}>
          Welcome, <strong>{user.displayName}</strong>
        </p>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 13 }}>
          Your account role (<code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{user.userType || 'unknown'}</code>) is not recognised.
          Please contact your administrator.
        </p>
        <button
          onClick={() => logout()}
          style={{
            background: 'linear-gradient(135deg, #0052CC, #003D99)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Sign Out
        </button>
      </FallbackCard>
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

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      uniqueToast.cleanup();
    }, 60000);

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
        <ErrorBoundary>
          <AuthProvider>
            <AppUpdateNotifier />
            <OfflineBanner />
            <AppWithProviders />
          </AuthProvider>
        </ErrorBoundary>
      )}
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
