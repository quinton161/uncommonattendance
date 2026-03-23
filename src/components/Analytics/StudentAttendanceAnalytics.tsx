import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { attendanceAnalyticsService, DateRange, StudentAnalytics } from '../../services/attendanceAnalyticsService';
import { DateRangeFilter } from './DateRangeFilter';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

// Enhanced color palette
const COLORS = {
  present: '#2563eb',
  late: '#f59e0b',
  absent: '#ef4444',
};

// Custom tooltip components
const CustomTooltipWrapper = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  box-shadow: ${theme.shadows.lg};
`;

const TooltipTitle = styled.div`
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.sm};
`;

const TooltipItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.xs};
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
  
  .value {
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
    margin-left: auto;
  }
`;

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <CustomTooltipWrapper>
        <TooltipTitle>{label}</TooltipTitle>
        {payload.map((entry, index) => (
          <TooltipItem key={index} $color={entry.color}>
            <span className="dot" />
            <span>{entry.name}</span>
            <span className="value">{entry.value}</span>
          </TooltipItem>
        ))}
      </CustomTooltipWrapper>
    );
  }
  return null;
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    gap: ${theme.spacing.sm};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    gap: ${theme.spacing.md};
  }
`;

const Card = styled(motion.div)`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.lg};
  overflow: hidden;
`;

const Title = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};

  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.lg};
    color: ${theme.colors.textPrimary};
  }
  span {
    font-size: ${theme.fontSizes.xs};
    color: ${theme.colors.textSecondary};
  }
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Stat = styled.div<{ $warn?: boolean }>`
  background: ${({ $warn }) =>
    $warn
      ? 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(245,158,11,0.12) 100%)'
      : `linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.primaryLight}18 100%)`};
  border: 1px solid ${({ $warn }) => ($warn ? 'rgba(239,68,68,0.18)' : `${theme.colors.primary}20`)};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  min-height: 86px;

  .v {
    font-weight: ${theme.fontWeights.bold};
    font-size: ${theme.fontSizes.xl};
    color: ${theme.colors.textPrimary};
  }
  .l {
    margin-top: 4px;
    font-size: ${theme.fontSizes.xs};
    color: ${theme.colors.textSecondary};
  }
`;

const Badge = styled.div<{ $kind: 'good' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid ${({ $kind }) => ($kind === 'good' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.28)')};
  background: ${({ $kind }) => ($kind === 'good' ? 'rgba(34,197,94,0.10)' : 'rgba(245,158,11,0.12)')};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
`;

const ChartContainer = styled.div`
  width: 100%;
  height: clamp(220px, 34vh, 360px);
  min-width: 0;
  min-height: 0;
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
`;

function fmtShort(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function StudentAttendanceAnalytics(props: { studentId: string }): React.ReactElement {
  const [range, setRange] = useState<DateRange>(attendanceAnalyticsService.getDefaultRange('student'));
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const cardAnim = useMemo(() => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }), []);

  useEffect(() => {
    if (range.preset && range.preset.value !== 'custom') {
      const newRange = attendanceAnalyticsService.presetToRange(range.preset);
      setRange(newRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.preset]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Initial fetch
    attendanceAnalyticsService.getStudentAnalytics(props.studentId, range).then((res) => {
      if (!mounted) return;
      setAnalytics(res);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setLoading(false);
    });

    // Real-time subscription
    const unsubscribe = attendanceAnalyticsService.subscribeToStudentAnalytics(
      props.studentId,
      range,
      (updatedAnalytics) => {
        if (!mounted) return;
        setAnalytics(updatedAnalytics);
        setLoading(false);
      }
    );

    return () => { 
      mounted = false; 
      unsubscribe();
    };
  }, [props.studentId, range.startDate, range.endDate]);

  const dailyData = (analytics?.daily || []).map(d => ({
    ...d,
    name: fmtShort(d.date),
    rate: d.status === 'present' || d.status === 'late' ? 100 : 0,
  }));
  const pieData = analytics?.distribution || [];
  const weekly = analytics?.weekly || [];

  // Debug logging for chart data issues
  console.log('[StudentAnalytics] Debug - Analytics data:', {
    hasData: !!analytics,
    dailyCount: analytics?.daily?.length || 0,
    pieData,
    distribution: analytics?.distribution,
    totals: analytics?.totals,
    weeklyCount: weekly.length,
  });

  const below = analytics?.warning.isBelowThreshold;

  return (
    <Page>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        <DateRangeFilter value={range} onChange={setRange} />
        <Badge $kind={below ? 'warn' : 'good'}>
          {below ? `Warning: below ${analytics?.warning.threshold}%` : 'On track'}
          <span style={{ opacity: 0.7 }}>{loading ? 'Updating…' : `${Math.round(analytics?.totals.attendanceRate || 0)}%`}</span>
        </Badge>
      </div>

      <Card {...cardAnim}>
        <Title>
          <h3>Your highlights</h3>
          <span>{analytics?.range.startDate} → {analytics?.range.endDate}</span>
        </Title>
        <StatRow>
          <Stat $warn={below}><div className="v">{Math.round(analytics?.totals.attendanceRate || 0)}%</div><div className="l">Attendance</div></Stat>
          <Stat><div className="v">{analytics?.streak.current ?? 0}</div><div className="l">Current streak</div></Stat>
          <Stat><div className="v">{analytics?.totals.late ?? 0}</div><div className="l">Late check-ins</div></Stat>
          <Stat><div className="v">{analytics?.totals.absent ?? 0}</div><div className="l">Absences</div></Stat>
        </StatRow>
      </Card>

      <Grid>
        <Card {...cardAnim}>
          <Title>
            <h3>Personal trend</h3>
            <span>Present vs late over time</span>
          </Title>
          <ChartContainer>
            {dailyData.length === 0 ? (
              <EmptyState>No attendance data for this period</EmptyState>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.gray200} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Line type="monotone" dataKey="present" name="Present" stroke={COLORS.present} strokeWidth={3} dot={{ fill: COLORS.present, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="late" name="Late" stroke={COLORS.late} strokeWidth={3} dot={{ fill: COLORS.late, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>

        <Card {...cardAnim}>
          <Title>
            <h3>Breakdown</h3>
            <span>Present vs late vs absent</span>
          </Title>
          <ChartContainer>
            {pieData.every(d => d.value === 0) ? (
              <EmptyState>No attendance data for this period</EmptyState>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={60} 
                    outerRadius={100} 
                    paddingAngle={3}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === 'Present' ? COLORS.present : entry.name === 'Late' ? COLORS.late : COLORS.absent}
                        stroke={theme.colors.white}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>
      </Grid>

      <Card {...cardAnim}>
        <Title>
          <h3>Weekly view</h3>
          <span>Last 7 business days</span>
        </Title>
          <ChartContainer>
          {weekly.length === 0 ? (
            <EmptyState>No attendance data for this period</EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.gray200} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="present" stackId="a" name="Present" fill={COLORS.present} radius={[6, 6, 0, 0]} animationDuration={800} />
                <Bar dataKey="late" stackId="a" name="Late" fill={COLORS.late} animationDuration={800} />
                <Bar dataKey="absent" stackId="a" name="Absent" fill={COLORS.absent} radius={[0, 0, 6, 6]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </ChartContainer>
      </Card>

      <Card {...cardAnim}>
        <Title>
          <h3>Progress</h3>
          <span>Attendance rate over time</span>
        </Title>
        <ChartContainer>
          {dailyData.length === 0 ? (
            <EmptyState>No attendance data for this period</EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.gray200} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" name="Rate (%)" stroke={below ? '#f59e0b' : '#22c55e'} strokeWidth={3} dot={{ fill: below ? '#f59e0b' : '#22c55e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </Card>
    </Page>
  );
}

