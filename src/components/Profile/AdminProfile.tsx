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
  FiShield,
  FiUser,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { eachDayOfInterval, subDays, format } from 'date-fns';
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

  /* Tablet and smaller */
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    gap: ${theme.spacing.lg};
  }

  /* Large screens (TVs) */
  @media (min-width: ${theme.breakpoints.tv}) {
    padding: ${theme.spacing['3xl']};
    gap: ${theme.spacing['3xl']};
    max-width: 2400px;
  }

  /* Extra large screens */
  @media (min-width: ${theme.breakpoints.wide}) {
    max-width: 1800px;
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
    gap: ${theme.spacing.xl};
  }

  @media (min-width: ${theme.breakpoints.tv}) {
    padding: ${theme.spacing['3xl']};
    border-radius: ${theme.borderRadius['3xl']};
  }

  @media (max-width: ${theme.breakpoints.xs}) {
    padding: ${theme.spacing.lg};
    gap: ${theme.spacing.lg};
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

  /* Large screens - show more columns */
  @media (min-width: ${theme.breakpoints.tv}) {
    grid-template-columns: repeat(4, 1fr);
    gap: ${theme.spacing.xl};
  }

  /* Wide screens */
  @media (min-width: ${theme.breakpoints.wide}) {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Small phones - single column */
  @media (max-width: ${theme.breakpoints.xs}) {
    grid-template-columns: 1fr;
  }
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

  /* Large screens (TVs) - more spacing */
  @media (min-width: ${theme.breakpoints.tv}) {
    gap: ${theme.spacing['3xl']};
    grid-template-columns: 1fr 1fr;
  }

  /* Small phones - single column */
  @media (max-width: ${theme.breakpoints.xs}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
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

  /* Large screens (TVs) */
  @media (min-width: ${theme.breakpoints.tv}) {
    grid-template-columns: repeat(4, 1fr);
    gap: ${theme.spacing.xl};
  }

  /* Wide screens */
  @media (min-width: ${theme.breakpoints.wide}) {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Small phones - single column */
  @media (max-width: ${theme.breakpoints.xs}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
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

const StudentAnalyticsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const StudentListGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};

  /* Large screens (TVs) - more columns */
  @media (min-width: ${theme.breakpoints.tv}) {
    grid-template-columns: repeat(4, 1fr);
    gap: ${theme.spacing.xl};
  }

  /* Wide screens */
  @media (min-width: ${theme.breakpoints.wide}) {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Desktop */
  @media (min-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Small phones - single column */
  @media (max-width: ${theme.breakpoints.xs}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
`;

const StudentCard = styled(motion.div)`
  background: white;
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};

  /* Large screens */
  @media (min-width: ${theme.breakpoints.tv}) {
    padding: ${theme.spacing.xl};
    border-radius: ${theme.borderRadius['2xl']};
  }

  /* Small phones */
  @media (max-width: ${theme.breakpoints.xs}) {
    padding: ${theme.spacing.md};
  }
`;

const StudentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  /* Small phones - stack on very small screens */
  @media (max-width: ${theme.breakpoints.xs}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.sm};
  }
`;

const StudentAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.primary};
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.div`
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
`;

const StudentEmail = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;

const AttendanceRate = styled.div<{ $rate: number }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${props => props.$rate >= 80 ? theme.colors.success + '15' : props.$rate >= 50 ? theme.colors.warning + '15' : theme.colors.error + '15'};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.fontWeights.semibold};
  color: ${props => props.$rate >= 80 ? theme.colors.success : props.$rate >= 50 ? theme.colors.warning : theme.colors.error};
`;

const MiniChart = styled.div`
  height: 60px;
  margin-top: ${theme.spacing.sm};
`;

const RecentActivity = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  max-height: 150px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  padding: ${theme.spacing.xs} 0;
  border-bottom: 1px solid ${theme.colors.gray100};

  &:last-child {
    border-bottom: none;
  }
`;

const PIE_COLORS = [theme.colors.primary, theme.colors.gray200];

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    todayAttendance: 0,
    avgAttendanceRate: 0,
    engagementRate: 0,
  });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<any[]>([]);

  useEffect(() => {
    const ds = DataService.getInstance();
    
    const fetchAdminData = async () => {
      const dashboardStats = await ds.getDashboardStats();
      const users = await ds.getUsers();
      const students = users.filter(u => u.userType === 'attendee' || !u.userType);
      
      // Calculate average attendance rate across all students using the same logic as StudentProfile
      const studentStatsPromises = students.map(s => ds.getStudentStats(s.id || s.uid));
      const allStudentStats = await Promise.all(studentStatsPromises);
      
      const totalRate = allStudentStats.reduce((acc, curr) => acc + curr.attendanceRate, 0);
      const avgRate = Math.round(totalRate / (students.length || 1));

      // Unified weekly trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const attendance = await ds.getAttendance();
      const chartData = last7Days.map(date => ({
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: attendance.filter(a => {
          const aDate = a.date || (a.checkInTime ? a.checkInTime.toISOString().split('T')[0] : '');
          return aDate === date;
        }).length
      }));

      setActivityData(chartData);
      setStats({
        totalEvents: dashboardStats.totalEvents,
        totalAttendees: students.length,
        todayAttendance: dashboardStats.todayAttendance,
        avgAttendanceRate: avgRate,
        engagementRate: Math.round((avgRate * 0.7) + (85 * 0.3)), // Unified engagement calculation
      });

      // Build student analytics data (same logic as StudentProfile)
      const studentAnalyticsData = await Promise.all(
        students.map(async (student) => {
          const studentId = student.id || student.uid;
          const studentStats = await ds.getStudentStats(studentId);
          const studentAttendance = await ds.getAttendance(studentId);
          
          // Calculate daily trend (last 7 days) - same as StudentProfile
          const last7Days = eachDayOfInterval({
            start: subDays(new Date(), 6),
            end: new Date(),
          });

          const trendData = last7Days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const present = studentAttendance.some((a: any) => {
              const aDate = a.date || (a.checkInTime ? format(new Date(a.checkInTime), 'yyyy-MM-dd') : '');
              return aDate === dateStr;
            });
            return {
              name: format(date, 'EEE'),
              rate: present ? 100 : 0
            };
          });

          return {
            id: studentId,
            name: student.displayName || student.name || 'Unknown',
            email: student.email || '',
            attendanceRate: studentStats.attendanceRate,
            totalSessions: studentStats.totalSessions || 0,
            trendData,
            recentActivity: (studentStats.recentActivity || []).slice(0, 5).map((a: any) => ({
              date: a.checkInTime,
              status: a.status || 'present'
            }))
          };
        })
      );

      // Sort by attendance rate (highest first)
      setStudentAnalytics(studentAnalyticsData.sort((a, b) => b.attendanceRate - a.attendanceRate));
    };

    fetchAdminData();

    // Real-time subscription for today's summary
    const unsubscribe = ds.subscribeToTodayAttendance(async (summary) => {
      // Update today's attendance count immediately
      setStats(prev => ({
        ...prev,
        todayAttendance: summary.presentCount,
      }));

      // Also refresh student analytics to show real-time check-ins
      // This ensures admin sees the same data as students when they check in
      const users = await ds.getUsers();
      const students = users.filter(u => u.userType === 'attendee' || !u.userType);
      const attendance = await ds.getAttendance();

      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date(),
      });

      const updatedStudentAnalytics = await Promise.all(
        students.map(async (student) => {
          const studentId = student.id || student.uid;
          const studentStats = await ds.getStudentStats(studentId);
          const studentAttendance = attendance.filter((a: any) => a.studentId === studentId || a.userId === studentId);

          const trendData = last7Days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const present = studentAttendance.some((a: any) => {
              const aDate = a.date || (a.checkInTime ? format(new Date(a.checkInTime), 'yyyy-MM-dd') : '');
              return aDate === dateStr;
            });
            return {
              name: format(date, 'EEE'),
              rate: present ? 100 : 0
            };
          });

          return {
            id: studentId,
            name: student.displayName || student.name || 'Unknown',
            email: student.email || '',
            attendanceRate: studentStats.attendanceRate,
            totalSessions: studentStats.totalSessions || 0,
            trendData,
            recentActivity: (studentStats.recentActivity || []).slice(0, 5).map((a: any) => ({
              date: a.checkInTime,
              status: a.status || 'present'
            }))
          };
        })
      );

      setStudentAnalytics(updatedStudentAnalytics.sort((a, b) => b.attendanceRate - a.attendanceRate));
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
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>Program Overview</span>
        </StatCard>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Avg. Attendance</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>{stats.avgAttendanceRate}%</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>Historical average</span>
        </StatCard>
        <StatCard whileHover={{ y: -5 }}>
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>Engagement Rate</span>
          <span style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold' }}>{stats.engagementRate}%</span>
          <span style={{ color: theme.colors.success, fontSize: theme.fontSizes.xs }}>System-wide score</span>
        </StatCard>
      </StatsGrid>

      <ChartsSection>
        <ChartCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: theme.spacing.xl, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTrendingUp color={theme.colors.primary} />
            Today's Snapshot
          </h3>
          <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
            Real-time synchronization with student check-ins.
          </p>
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: theme.colors.primary }}>{stats.todayAttendance}</div>
              <div style={{ color: theme.colors.textSecondary }}>Present Today</div>
              <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.success, marginTop: '8px' }}>
                {Math.round((stats.todayAttendance / (stats.totalAttendees || 1)) * 100)}% Participation
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: theme.spacing.xl, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiActivity color={theme.colors.primary} />
            Weekly Volume
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

      <StudentAnalyticsSection>
        <h2 style={{ fontSize: theme.fontSizes.xl, marginTop: theme.spacing.lg }}>
          <FiUsers style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Student Analytics
        </h2>
        <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Individual student attendance trends and overview - same data students see in their profiles
        </p>
        <StudentListGrid>
          {studentAnalytics.map((student) => (
            <StudentCard
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
            >
              <StudentHeader>
                <StudentAvatar>
                  <FiUser size={20} />
                </StudentAvatar>
                <StudentInfo>
                  <StudentName>{student.name}</StudentName>
                  <StudentEmail>{student.email}</StudentEmail>
                </StudentInfo>
                <AttendanceRate $rate={student.attendanceRate}>
                  <FiCheckCircle size={14} />
                  {student.attendanceRate}%
                </AttendanceRate>
              </StudentHeader>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
                <span>Total Sessions: {student.totalSessions}</span>
              </div>

              <MiniChart>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={student.trendData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Attendance']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke={theme.colors.primary} 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </MiniChart>

              {student.recentActivity.length > 0 && (
                <>
                  <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>Recent Activity</div>
                  <RecentActivity>
                    {student.recentActivity.map((activity: any, idx: number) => (
                      <ActivityItem key={idx}>
                        <FiClock size={12} />
                        <span>{activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}</span>
                        <span style={{ 
                          color: activity.status === 'present' ? theme.colors.success : theme.colors.error,
                          marginLeft: 'auto'
                        }}>
                          {activity.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </ActivityItem>
                    ))}
                  </RecentActivity>
                </>
              )}
            </StudentCard>
          ))}
        </StudentListGrid>
      </StudentAnalyticsSection>

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
