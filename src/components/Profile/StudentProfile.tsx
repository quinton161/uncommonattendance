import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiAtSign, 
  FiBookOpen, 
  FiCalendar, 
  FiAward, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiClock,
  FiCamera
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { uniqueToast } from '../../utils/toastUtils';
import { ProfileUpload } from './ProfileUpload';
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

const ProfileIntroSection = styled.div`
  h2 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.fontSizes.xl};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;

const HeroSection = styled(motion.div)`
  background: white;
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing['2xl']};
  display: flex;
  align-items: center;
  gap: ${theme.spacing['2xl']};
  box-shadow: ${theme.shadows.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.secondary}10 100%);
    border-radius: 50%;
    transform: translate(100px, -100px);
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    padding: ${theme.spacing.xl};
    text-align: center;
    gap: ${theme.spacing.xl};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const ProfileImage = styled.img`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: ${theme.shadows.md};
`;

const AvatarPlaceholder = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: ${theme.colors.gray100};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.gray400};
  border: 4px solid white;
  box-shadow: ${theme.shadows.md};
`;

const ProgressRing = styled.svg`
  position: absolute;
  top: -10px;
  left: -10px;
  width: 180px;
  height: 180px;
  transform: rotate(-90deg);
`;

const InfoWrapper = styled.div`
  flex: 1;
  z-index: 1;
`;

const Name = styled.h1`
  font-size: ${theme.fontSizes['4xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const Course = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.lg};
  margin-bottom: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.tablet}) {
    justify-content: center;
  }
`;

const Badge = styled.span<{ status: 'on-track' | 'warning' | 'at-risk' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 1px;
  background: ${props => {
    switch (props.status) {
      case 'on-track': return '#dcfce7';
      case 'warning': return '#fef9c3';
      case 'at-risk': return '#fee2e2';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'on-track': return '#166534';
      case 'warning': return '#854d0e';
      case 'at-risk': return '#991b1b';
    }
  }};
`;

const QuickStats = styled.div`
  display: flex;
  gap: ${theme.spacing.xl};
  margin-top: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.tablet}) {
    justify-content: center;
    gap: ${theme.spacing.lg};
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
`;

const StatLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(motion.div)`
  background: white;
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.md};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const ChartTitle = styled.h3`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const TimelineContainer = styled(motion.div)`
  background: white;
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.md};
`;

const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.lg};
  max-height: 400px;
  overflow-y: auto;
  padding-right: ${theme.spacing.sm};

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: ${theme.colors.gray100};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.gray300};
    border-radius: 3px;
  }
`;

const TimelineItem = styled(motion.div)`
  display: flex;
  gap: ${theme.spacing.md};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 32px;
    bottom: -20px;
    width: 2px;
    background: ${theme.colors.gray100};
  }

  &:last-child::before {
    display: none;
  }
`;

const StatusDot = styled.div<{ status: 'present' | 'late' | 'absent' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'present': return '#dcfce7';
      case 'late': return '#fef9c3';
      case 'absent': return '#fee2e2';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  flex-shrink: 0;
  color: ${props => {
    switch (props.status) {
      case 'present': return '#166534';
      case 'late': return '#854d0e';
      case 'absent': return '#991b1b';
    }
  }};
`;

const TimelineContent = styled.div`
  flex: 1;
  padding-bottom: ${theme.spacing.md};
`;

const TimelineDate = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const TimelineSession = styled.div`
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
`;

const InsightCard = styled(motion.div)<{ type: 'warning' | 'info' | 'success' }>`
  background: ${props => {
    switch (props.type) {
      case 'warning': return '#fff7ed';
      case 'info': return '#f0f9ff';
      case 'success': return '#f0fdf4';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'warning': return '#fed7aa';
      case 'info': return '#bae6fd';
      case 'success': return '#bbf7d0';
    }
  }};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-start;
  color: ${props => {
    switch (props.type) {
      case 'warning': return '#9a3412';
      case 'info': return '#075985';
      case 'success': return '#166534';
    }
  }};
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${theme.spacing.xl};
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid ${theme.colors.primary}20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border-radius: 50%;
    border: 8px solid ${theme.colors.primary};
    border-color: ${theme.colors.primary} ${theme.colors.primary} transparent transparent;
    transform: rotate(45deg);
  }
`;

export const StudentProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [stats, setStats] = useState({
    attendanceRate: 0,
    currentStreak: 0,
    engagementScore: 0,
    status: 'on-track' as 'on-track' | 'warning' | 'at-risk',
    course: 'Full Stack Web Development',
    profession: '',
    displayName: '',
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    displayName: '',
    course: '',
    profession: '',
    bio: ''
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const initialValues = {
        displayName: user.displayName || '',
        course: user.course || 'Full Stack Web Development',
        profession: user.profession || '',
        bio: user.bio || ''
      };
      setStats(prev => ({ ...prev, ...initialValues }));
      setEditValues(initialValues);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    const name = editValues.displayName.trim();
    if (!name) {
      uniqueToast.error('Please enter your name');
      return;
    }
    try {
      await updateProfile({
        displayName: name,
        bio: editValues.bio,
        course: editValues.course,
        profession: editValues.profession,
      });
      setStats(prev => ({
        ...prev,
        displayName: name,
        bio: editValues.bio,
        course: editValues.course,
        profession: editValues.profession,
      }));
      setIsEditing(false);
      uniqueToast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      uniqueToast.error('Failed to update profile');
    }
  };

  const loadProfileAttendance = useCallback(async () => {
    if (!user?.uid) return;
    const ds = DataService.getInstance();

    try {
      const studentStats = await ds.getStudentStats(user.uid);
      const attendance = await ds.getAttendance(user.uid);

      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date(),
      });

      const chartData = last7Days.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const present = attendance.some((a) => {
          const aDate = a.date || (a.checkInTime ? format(new Date(a.checkInTime), 'yyyy-MM-dd') : '');
          return aDate === dateStr;
        });
        return {
          name: format(date, 'EEE'),
          rate: present ? 100 : 0,
        };
      });

      setTrendData(chartData);

      const rate = Number(studentStats?.attendanceRate) || 0;
      setPieData([
        { name: 'Present', value: rate, color: theme.colors.primary },
        { name: 'Absent', value: Math.max(0, 100 - rate), color: theme.colors.gray200 },
      ]);

      const recent = Array.isArray(studentStats?.recentActivity) ? studentStats.recentActivity : [];
      setSessions(
        recent.map((a: any) => ({
          date: a.checkInTime,
          session: 'General Session',
          status: a.status || 'present',
        }))
      );

      setStats((prev) => ({
        ...prev,
        attendanceRate: rate,
        currentStreak: studentStats?.currentStreak ?? 0,
        engagementScore: Math.round(rate * 0.7 + 85 * 0.3),
        status: rate >= 80 ? 'on-track' : rate >= 60 ? 'warning' : 'at-risk',
      }));
    } catch (e) {
      console.error('Student profile data load:', e);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) void loadProfileAttendance();
    };
    run();

    const q = query(collection(db, 'attendance'), where('studentId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      () => {
        if (!cancelled) void loadProfileAttendance();
      },
      (err) => console.error('Student profile attendance listener:', err)
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user?.uid, loadProfileAttendance]);
  
  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (stats.attendanceRate / 100) * circumference;

  return (
    <ProfileContainer>
      <ProfileIntroSection>
        <h2>Your profile</h2>
        <p>Your attendance, charts, and editable details</p>
      </ProfileIntroSection>
      <AnimatePresence>
        {showPhotoUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.md
            }}
            onClick={() => setShowPhotoUpload(false)}
          >
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px' }}>
              <ProfileUpload />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HeroSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AvatarWrapper>
          <ProgressRing>
            <circle
              cx="90"
              cy="90"
              r="85"
              stroke={theme.colors.gray100}
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              cx="90"
              cy="90"
              r="85"
              stroke={theme.colors.primary}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </ProgressRing>
          
          {user?.photoUrl ? (
            <ProfileImage src={user.photoUrl} alt={user.displayName || 'Profile'} />
          ) : (
            <AvatarPlaceholder>
              <FiUser size={64} />
            </AvatarPlaceholder>
          )}
          
          <Button
            variant="primary"
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows.md
            }}
            onClick={() => setShowPhotoUpload(true)}
          >
            <FiCamera size={18} />
          </Button>
        </AvatarWrapper>

        <InfoWrapper>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap', marginBottom: theme.spacing.xs }}>
            {isEditing ? (
              <input
                type="text"
                value={editValues.displayName}
                onChange={(e) => setEditValues({ ...editValues, displayName: e.target.value })}
                placeholder="Full Name"
                style={{
                  fontSize: theme.fontSizes['2xl'],
                  fontWeight: theme.fontWeights.bold,
                  padding: '4px 8px',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.gray300}`,
                  width: '100%',
                  maxWidth: '300px'
                }}
              />
            ) : (
              <Name>{stats.displayName || 'Student Name'}</Name>
            )}
            <Badge status={stats.status}>{stats.status.replace('-', ' ')}</Badge>
          </div>
          
          <Course>
            <FiBookOpen size={20} />
            {isEditing ? (
              <input
                type="text"
                value={editValues.course}
                onChange={(e) => setEditValues({ ...editValues, course: e.target.value })}
                placeholder="Course"
                style={{
                  padding: '4px 8px',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.gray300}`,
                  fontSize: theme.fontSizes.sm
                }}
              />
            ) : (
              stats.course
            )}
          </Course>

          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
            <FiUser size={20} />
            {isEditing ? (
              <input
                type="text"
                value={editValues.profession}
                onChange={(e) => setEditValues({ ...editValues, profession: e.target.value })}
                placeholder="Profession"
                style={{
                  padding: '4px 8px',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.gray300}`,
                  fontSize: theme.fontSizes.sm
                }}
              />
            ) : (
              <span>{stats.profession || 'No profession set'}</span>
            )}
          </div>

          {isEditing ? (
            <div style={{ marginBottom: theme.spacing.md }}>
              <div style={{ fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.semibold, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
                About you
              </div>
              <textarea
                value={editValues.bio}
                onChange={(e) => setEditValues({ ...editValues, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.gray300}`,
                  fontSize: theme.fontSizes.sm,
                  resize: 'vertical'
                }}
              />
            </div>
          ) : (
            stats.bio && (
              <div style={{ marginBottom: theme.spacing.md, maxWidth: '100%' }}>
                <div style={{ fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.semibold, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
                  About
                </div>
                <p style={{ margin: 0, fontSize: theme.fontSizes.sm, color: theme.colors.textPrimary, lineHeight: 1.5 }}>
                  {stats.bio}
                </p>
              </div>
            )
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <FiAtSign size={16} />
              {user?.email}
              <span style={{ fontSize: '10px', opacity: 0.6 }}>(Not editable)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
            {isEditing ? (
              <>
                <Button variant="primary" size="sm" onClick={handleUpdateProfile}>Save changes</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditValues({
                      displayName: stats.displayName,
                      course: stats.course,
                      profession: stats.profession,
                      bio: stats.bio,
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditValues({
                    displayName: stats.displayName,
                    course: stats.course,
                    profession: stats.profession,
                    bio: stats.bio,
                  });
                  setIsEditing(true);
                }}
              >
                Edit profile
              </Button>
            )}
          </div>

          <QuickStats>
            <StatItem>
              <StatValue>{stats.attendanceRate}%</StatValue>
              <StatLabel>Attendance</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.currentStreak}</StatValue>
              <StatLabel>Day Streak</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.engagementScore}</StatValue>
              <StatLabel>Engagement</StatLabel>
            </StatItem>
          </QuickStats>
        </InfoWrapper>
      </HeroSection>

      <InsightsGrid>
        <InsightCard
          type={stats.status === 'on-track' ? 'success' : 'warning'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FiAlertCircle size={24} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Performance Insight</div>
            <div style={{ fontSize: theme.fontSizes.sm }}>
              {stats.status === 'on-track' 
                ? "Excellent work! Your consistency is helping you stay on top of the program."
                : "Your attendance is below target. Try attending more sessions to improve your standing."
              }
            </div>
          </div>
        </InsightCard>

        <ChartCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xl }}
        >
          <ScoreCircle>
            <div style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold', color: theme.colors.primary }}>{stats.engagementScore}</div>
            <div style={{ fontSize: '10px', color: theme.colors.textSecondary, textTransform: 'uppercase' }}>Score</div>
          </ScoreCircle>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Engagement Level</div>
            <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>Calculated based on attendance (70%) and session participation (30%).</div>
          </div>
        </ChartCard>
      </InsightsGrid>

      <ChartsGrid>
        <ChartCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ChartTitle>
            <FiTrendingUp />
            Attendance Trend
          </ChartTitle>
          <div style={{ width: '100%', minWidth: 0, height: 300, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.gray100} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} 
                />
                <YAxis 
                  hide 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: theme.borderRadius.md, 
                    border: 'none', 
                    boxShadow: theme.shadows.lg 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke={theme.colors.primary} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: theme.colors.primary, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ChartTitle>
            <FiAward />
            Overall Status
          </ChartTitle>
          <div style={{ width: '100%', minWidth: 0, height: 300, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: theme.borderRadius.md, 
                    border: 'none', 
                    boxShadow: theme.shadows.lg 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: -160 }}>
              <div style={{ fontSize: theme.fontSizes['2xl'], fontWeight: 'bold', color: theme.colors.textPrimary }}>{stats.attendanceRate}%</div>
              <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>Present</div>
            </div>
          </div>
        </ChartCard>
      </ChartsGrid>

      <TimelineContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <ChartTitle>
          <FiCalendar />
          Session History
        </ChartTitle>
        <TimelineList>
          {sessions.length > 0 ? (
            sessions.map((session, index) => (
              <TimelineItem
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + (index * 0.1) }}
              >
                <StatusDot status={session.status as any}>
                  {session.status === 'present' && <FiCheckCircle size={16} />}
                  {session.status === 'late' && <FiClock size={16} />}
                  {session.status === 'absent' && <FiAlertCircle size={16} />}
                </StatusDot>
                <TimelineContent>
                  <TimelineDate>{format(new Date(session.date), 'EEEE, MMMM do')}</TimelineDate>
                  <TimelineSession>{session.session}</TimelineSession>
                </TimelineContent>
              </TimelineItem>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textSecondary }}>
              No session history found.
            </div>
          )}
        </TimelineList>
      </TimelineContainer>
    </ProfileContainer>
  );
};
