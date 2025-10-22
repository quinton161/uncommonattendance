import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Button } from '../Common/Button';
import { UncommonLogo } from '../Common/UncommonLogo';
import DataService from '../../services/DataService';
import { uniqueToast } from '../../utils/toastUtils';
import {
  TrendingUpIcon,
  CheckCircleIcon,
  TodayIcon,
  BarChartIcon
} from '../Common/Icons';

const PageContainer = styled.div`
  padding: ${theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: ${theme.colors.backgroundSecondary};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg};
    max-width: 100%;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.primary};
`;

const HeaderTitle = styled.div`
  h1 {
    font-family: ${theme.fonts.heading};
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.textPrimary};
    margin: 0 0 ${theme.spacing.sm} 0;
    line-height: 1.2;
  }
  
  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.fontSizes.lg};
  }
`;

const ProgressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: ${theme.spacing.md};
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const ProgressCard = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.md};
  border: 1px solid ${theme.colors.gray200};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.lg};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.white};
`;

const CardTitle = styled.h3`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.full};
  overflow: hidden;
  margin: ${theme.spacing.md} 0;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%);
  border-radius: ${theme.borderRadius.full};
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  text-align: center;
  margin: ${theme.spacing.md} 0;
`;

const AchievementsList = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
`;

const AchievementsHeader = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.gray200};
  
  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.xl};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
`;

const Achievement = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.gray100};
  
  &:last-child {
    border-bottom: none;
  }
`;

const AchievementIcon = styled.div<{ earned: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.full};
  background: ${props => props.earned 
    ? `linear-gradient(135deg, ${theme.colors.success} 0%, #16a34a 100%)`
    : theme.colors.gray200
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.earned ? theme.colors.white : theme.colors.gray400};
`;

const AchievementInfo = styled.div`
  flex: 1;
  
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textPrimary};
  }
  
  p {
    margin: 0;
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;

interface ProgressPageProps {
  onBack?: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    attendanceRate: 85,
    currentStreak: 5,
    totalDays: 42,
    monthlyGoal: 20,
    monthlyProgress: 15,
    lateCheckIns: 0,
    averageCheckInTime: '9:15 AM'
  });
  const [loading, setLoading] = useState(true);
  const dataService = DataService.getInstance();

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await dataService.testConnection();
      const studentStats = await dataService.getStudentStats(user.uid);
      
      setStats({
        attendanceRate: studentStats.attendanceRate,
        currentStreak: studentStats.currentStreak,
        totalDays: studentStats.totalCheckIns,
        monthlyGoal: 20,
        monthlyProgress: studentStats.monthlyAttendance,
        lateCheckIns: studentStats.lateCheckIns || 0,
        averageCheckInTime: studentStats.averageCheckInTime
      });
    } catch (error) {
      console.error('Error loading progress data:', error);
      uniqueToast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    {
      id: 1,
      title: 'First Check-in',
      description: 'Complete your first attendance check-in',
      earned: stats.totalDays > 0
    },
    {
      id: 2,
      title: 'Week Warrior',
      description: 'Maintain a 7-day attendance streak',
      earned: stats.currentStreak >= 7
    },
    {
      id: 3,
      title: 'Perfect Month',
      description: 'Achieve 100% attendance for a month',
      earned: stats.attendanceRate >= 100
    },
    {
      id: 4,
      title: 'Consistency King',
      description: 'Check in for 30 consecutive days',
      earned: stats.currentStreak >= 30
    }
  ];

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          <h1 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: theme.spacing.lg,
            margin: 0 
          }}>
            <UncommonLogo size="lg" showSubtitle={false} />
            <span>Progress</span>
          </h1>
          <p>Track your attendance progress and achievements</p>
        </HeaderTitle>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </Header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          Loading your progress...
        </div>
      ) : (
        <>
          <ProgressGrid>
            <ProgressCard>
              <CardHeader>
                <CardIcon>
                  <BarChartIcon size={24} />
                </CardIcon>
                <CardTitle>Attendance Rate</CardTitle>
              </CardHeader>
              <ProgressBar>
                <ProgressFill percentage={stats.attendanceRate} />
              </ProgressBar>
              <ProgressText>
                <span>{stats.attendanceRate}% Complete</span>
                <span>{stats.totalDays} days attended</span>
              </ProgressText>
            </ProgressCard>

            <ProgressCard>
              <CardHeader>
                <CardIcon>
                  <TrendingUpIcon size={24} />
                </CardIcon>
                <CardTitle>Current Streak</CardTitle>
              </CardHeader>
              <StatValue>{stats.currentStreak} days</StatValue>
              <ProgressText>
                <span>Keep it up!</span>
              </ProgressText>
            </ProgressCard>

            <ProgressCard>
              <CardHeader>
                <CardIcon>
                  <TodayIcon size={24} />
                </CardIcon>
                <CardTitle>Monthly Goal</CardTitle>
              </CardHeader>
              <ProgressBar>
                <ProgressFill percentage={(stats.monthlyProgress / stats.monthlyGoal) * 100} />
              </ProgressBar>
              <ProgressText>
                <span>{stats.monthlyProgress} / {stats.monthlyGoal} days</span>
                <span>{Math.round((stats.monthlyProgress / stats.monthlyGoal) * 100)}%</span>
              </ProgressText>
            </ProgressCard>
          </ProgressGrid>

          <AchievementsList>
            <AchievementsHeader>
              <h3>Achievements</h3>
            </AchievementsHeader>
            
            {achievements.map((achievement) => (
              <Achievement key={achievement.id}>
                <AchievementIcon earned={achievement.earned}>
                  <CheckCircleIcon size={20} />
                </AchievementIcon>
                <AchievementInfo>
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                </AchievementInfo>
              </Achievement>
            ))}
          </AchievementsList>
        </>
      )}
    </PageContainer>
  );
};
