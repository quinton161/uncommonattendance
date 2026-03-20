import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiActivity, 
  FiUsers, 
  FiDownload, 
  FiTrendingUp,
  FiUserPlus,
  FiPlayCircle,
  FiShield
} from 'react-icons/fi';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import DataService from '../../services/DataService';

const ProfileContainer = styled.div`
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    gap: ${theme.spacing.lg};
  }
`;

const AdminHero = styled(motion.div)`
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing['2xl']};
  color: white;
  display: flex;
  align-items: center;
  gap: ${theme.spacing['2xl']};
  box-shadow: ${theme.shadows.lg};
  position: relative;
  overflow: hidden;

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    padding: ${theme.spacing.xl};
    text-align: center;
  }
`;

const AdminInfo = styled.div`
  flex: 1;
  z-index: 1;
`;

const RoleBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: ${theme.spacing.sm};
  display: inline-block;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
`;

const StatCard = styled(motion.div)`
  background: white;
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(motion.div)`
  background: white;
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
`;

const ActionCard = styled(Button)`
  height: auto;
  padding: ${theme.spacing.xl};
  flex-direction: column;
  gap: ${theme.spacing.sm};
  text-align: center;
  border-radius: ${theme.borderRadius.xl};
  background: white;
  color: ${theme.colors.primary};
  border: 1px solid ${theme.colors.gray200};
  box-shadow: ${theme.shadows.sm};
  
  &:hover {
    background: ${theme.colors.gray50};
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }
  
  span {
    color: ${theme.colors.primary};
    font-weight: ${theme.fontWeights.medium};
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${theme.colors.primary};
  }
`;

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    engagementRate: 0,
  });
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    const ds = DataService.getInstance();
    
    const fetchStats = async () => {
      const dashboardStats = await ds.getDashboardStats();
      const attendance = await ds.getAttendance();
      
      // Group attendance by day for the line chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const chartData = last7Days.map(date => ({
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: attendance.filter(a => a.date === date).length
      }));

      setActivityData(chartData);
      setStats({
        totalEvents: dashboardStats.totalEvents,
        totalAttendees: dashboardStats.totalAttendees,
        todayAttendance: dashboardStats.todayAttendance,
        attendanceRate: Math.round((dashboardStats.todayAttendance / (dashboardStats.totalAttendees || 1)) * 100),
        engagementRate: 85, // Placeholder until real engagement logic is added to DataService
      });
    };

    fetchStats();

    // Subscribe to real-time updates for today's attendance
    const unsubscribe = ds.subscribeToTodayAttendance((summary) => {
      setStats(prev => ({
        ...prev,
        todayAttendance: summary.presentCount,
        attendanceRate: Math.round((summary.presentCount / (summary.totalUsers || 1)) * 100)
      }));
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProfileContainer>
      <AdminHero
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ width: 120, height: 120, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiShield size={64} />
        </div>
        <AdminInfo>
          <RoleBadge>{user?.userType || 'Administrator'}</RoleBadge>
          <h1 style={{ fontSize: theme.fontSizes['4xl'], margin: '0 0 8px 0' }}>{user?.displayName}</h1>
          <p style={{ opacity: 0.8 }}>Managing {stats.totalEvents} Active Classes • {stats.totalAttendees} Total Students</p>
        </AdminInfo>
      </AdminHero>

      <StatsGrid>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Total Sessions</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>{stats.totalEvents}</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>Active program</span>
        </StatCard>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Today's Attendance</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>{stats.attendanceRate}%</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>{stats.todayAttendance} students present</span>
        </StatCard>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Engagement Rate</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>{stats.engagementRate}%</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>Overall participation</span>
        </StatCard>
      </StatsGrid>

      <ChartsSection>
        <ChartCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: theme.spacing.xl, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTrendingUp color={theme.colors.primary} />
            Real-time Insights
          </h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
            Live data reflecting student presence and program engagement across all active sessions.
          </p>
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: theme.colors.primary }}>{stats.todayAttendance}</div>
              <div style={{ color: theme.colors.textSecondary }}>Students Present Today</div>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: theme.spacing.xl, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiActivity color={theme.colors.primary} />
            Weekly Attendance Trend
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke={theme.colors.primary} strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </ChartsSection>

      <h2 style={{ fontSize: theme.fontSizes.xl, marginTop: theme.spacing.lg }}>Quick Actions</h2>
      <ActionGrid>
        <ActionCard>
          <FiPlayCircle />
          <span>Start New Session</span>
        </ActionCard>
        <ActionCard>
          <FiUserPlus />
          <span>Add New Student</span>
        </ActionCard>
        <ActionCard>
          <FiDownload />
          <span>Export Monthly Report</span>
        </ActionCard>
        <ActionCard>
          <FiUsers />
          <span>Manage Instructor Team</span>
        </ActionCard>
      </ActionGrid>
    </ProfileContainer>
  );
};
