import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiActivity, 
  FiUsers, 
  FiCalendar, 
  FiDownload, 
  FiTrendingUp,
  FiAward,
  FiCheckCircle,
  FiUserPlus,
  FiPlayCircle,
  FiShield,
  FiClock
} from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';

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
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();

  // Mock data
  const classStats = [
    { name: 'Web Dev A', attendance: 94, engagement: 88 },
    { name: 'Web Dev B', attendance: 82, engagement: 75 },
    { name: 'Design A', attendance: 91, engagement: 92 },
    { name: 'Design B', attendance: 88, engagement: 84 },
  ];

  const activityData = [
    { name: 'Mon', sessions: 4 },
    { name: 'Tue', sessions: 6 },
    { name: 'Wed', sessions: 3 },
    { name: 'Thu', sessions: 5 },
    { name: 'Fri', sessions: 7 },
  ];

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
          <p style={{ opacity: 0.8 }}>Managing 4 Active Classes • 124 Total Students</p>
        </AdminInfo>
      </AdminHero>

      <StatsGrid>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Total Sessions</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>42</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>+12% from last month</span>
        </StatCard>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Avg. Attendance</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>89%</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>Stable performance</span>
        </StatCard>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Engagement Rate</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>84%</span>
          <span style={{ color: theme.colors.warning, fontSize: theme.fontSizes.xs }}>-2% dip detected</span>
        </StatCard>
      </StatsGrid>

      <ChartsSection>
        <ChartCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: theme.spacing.xl, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTrendingUp color={theme.colors.primary} />
            Class Performance
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill={theme.colors.primary} radius={[4, 4, 0, 0]} name="Attendance %" />
                <Bar dataKey="engagement" fill={theme.colors.secondary} radius={[4, 4, 0, 0]} name="Engagement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: theme.spacing.xl, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiActivity color={theme.colors.primary} />
            Weekly Activity
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
        <ActionCard variant="primary">
          <FiPlayCircle />
          <span>Start New Session</span>
        </ActionCard>
        <ActionCard variant="outline">
          <FiUserPlus />
          <span>Add New Student</span>
        </ActionCard>
        <ActionCard variant="outline">
          <FiDownload />
          <span>Export Monthly Report</span>
        </ActionCard>
        <ActionCard variant="outline">
          <FiUsers />
          <span>Manage Instructor Team</span>
        </ActionCard>
      </ActionGrid>
    </ProfileContainer>
  );
};
