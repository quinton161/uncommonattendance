import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import DataService from '../../services/DataService';
import { attendanceAnalyticsService, AdminAnalytics, DateRange } from '../../services/attendanceAnalyticsService';
import { DateRangeFilter } from './DateRangeFilter';
import { AttendanceHeatmap } from './AttendanceHeatmap';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Enhanced color palette with gradients and modern colors
const COLORS = {
  present: '#22c55e', // Green to match student dashboard success
  late: '#f59e0b',
  absent: '#ef4444',
  presentGradient: ['#22c55e', '#16a34a'],
  lateGradient: ['#fbbf24', '#d97706'],
  absentGradient: ['#f87171', '#dc2626'],
};

// Custom tooltip component for charts
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    gap: ${theme.spacing.sm};
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;

  @media (max-width: ${theme.breakpoints.tablet}) {
    gap: ${theme.spacing.md};
  }
`;

// SummaryCard removed to fix ESLint unused variable warnings.

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Stat = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.primaryLight}18 100%);
  border: 1px solid ${theme.colors.primary}20;
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  min-height: 86px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .v {
    font-weight: ${theme.fontWeights.bold};
    font-size: ${theme.fontSizes['2xl']};
    color: ${theme.colors.textPrimary};
    line-height: 1;
  }
  .l {
    margin-top: ${theme.spacing.xs};
    font-size: ${theme.fontSizes.sm};
    color: ${theme.colors.textSecondary};
    font-weight: ${theme.fontWeights.medium};
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    min-height: 70px;
    .v {
      font-size: ${theme.fontSizes.xl};
    }
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 320px;
  min-width: 0;
  min-height: 0;
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    height: 280px;
  }
  
  @media (max-width: ${theme.breakpoints.mobile}) {
    height: 240px;
  }
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
`;

const Card = styled(motion.div)`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.lg};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: ${theme.shadows.md};
  }
  
  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.lg};
  }
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};

  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.lg};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textPrimary};
  }
  span {
    font-size: ${theme.fontSizes.xs};
    color: ${theme.colors.textSecondary};
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  min-height: 44px;
  background: ${theme.colors.white};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textPrimary};
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
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

const Table = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${theme.spacing.md};
  align-items: center;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.backgroundSecondary};
  transition: transform 0.2s;
  
  &:hover {
    transform: translateX(4px);
  }
`;

const BarWrap = styled.div`
  height: 8px;
  border-radius: 999px;
  background: ${theme.colors.gray200};
  overflow: hidden;
  margin-top: ${theme.spacing.sm};
`;

const BarFill = styled.div<{ $p: number; $kind: 'good' | 'bad' }>`
  height: 100%;
  width: ${({ $p }) => `${Math.max(0, Math.min(100, $p))}%`};
  background: ${({ $kind }) => ($kind === 'good' ? `linear-gradient(90deg, ${theme.colors.success}, #16a34a)` : 'linear-gradient(90deg, #ef4444, #dc2626)')};
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

function fmtShort(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdminAttendanceAnalytics(): React.ReactElement {
  const dataService = DataService.getInstance();
  const [range, setRange] = useState<DateRange>(attendanceAnalyticsService.getDefaultRange('week'));
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const cardAnim = useMemo(() => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }), []);

  useEffect(() => {
    (async () => {
      await dataService.testConnection();
      const users = await dataService.getUsers();
      const list = users.filter((u: any) => !u.userType || u.userType === 'attendee');
      setStudents(list);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // auto-resolve preset to concrete dates
    if (range.preset !== 'custom') {
      const next = attendanceAnalyticsService.getDefaultRange(range.preset);
      setRange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.preset]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const res = await attendanceAnalyticsService.getAdminAnalytics(range, {
        studentId: selectedStudentId === 'all' ? undefined : selectedStudentId,
      });
      if (!mounted) return;
      setAnalytics(res);
      setLoading(false);
    })().catch(() => {
      if (!mounted) return;
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [range.startDate, range.endDate, selectedStudentId]);

  const pieData = analytics?.distribution || [];
  const dailyData = (analytics?.daily || []).map(d => ({
    ...d,
    name: fmtShort(d.date),
  }));

  // Debug logging for chart data issues
  console.log('[AdminAnalytics] Debug - Analytics data:', {
    hasData: !!analytics,
    dailyCount: analytics?.daily?.length || 0,
    pieData,
    distribution: analytics?.distribution,
    totals: analytics?.totals,
    heatmapCount: analytics?.heatmap?.length || 0,
    leaderboardCount: analytics?.leaderboardTop?.length || 0,
  });

  return (
    <Page>
      <FilterRow>
        <DateRangeFilter value={range} onChange={setRange} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, flex: '1 1 240px' }}>
          <label style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary, fontWeight: theme.fontWeights.medium }}>Student</label>
          <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} style={{ width: '100%' }}>
            <option value="all">All students</option>
            {students.map(s => (
              <option key={s.uid || s.id} value={s.uid || s.id}>
                {s.displayName || s.email || (s.uid || s.id)}
              </option>
            ))}
          </Select>
        </div>
      </FilterRow>

      <Card {...cardAnim}>
        <Title>
          <h3>Attendance overview</h3>
          <span>{loading ? 'Updating…' : `${analytics?.range.startDate} → ${analytics?.range.endDate}`}</span>
        </Title>
        <StatRow>
          <Stat><div className="v">{Math.round(analytics?.totals.attendanceRate || 0)}%</div><div className="l">Attendance rate</div></Stat>
          <Stat><div className="v">{analytics?.totals.present ?? 0}</div><div className="l">Present</div></Stat>
          <Stat><div className="v">{analytics?.totals.late ?? 0}</div><div className="l">Late</div></Stat>
          <Stat><div className="v">{analytics?.totals.absent ?? 0}</div><div className="l">Absent</div></Stat>
        </StatRow>
      </Card>

      <Grid>
        <Card {...cardAnim}>
          <Title>
            <h3>Daily trend</h3>
            <span>{loading ? 'Updating…' : `Range: ${analytics?.range.startDate} → ${analytics?.range.endDate}`}</span>
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
                  <Line type="monotone" dataKey="absent" name="Absent" stroke={COLORS.absent} strokeWidth={3} dot={{ fill: COLORS.absent, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </Card>

        <Card {...cardAnim}>
          <Title>
            <h3>Distribution</h3>
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
          <h3>Stacked comparison</h3>
          <span>Present / late / absent per day</span>
        </Title>
        <ChartContainer>
          {dailyData.length === 0 ? (
            <EmptyState>No attendance data for this period</EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
        <AttendanceHeatmap title="Low-attendance heatmap" cells={analytics?.heatmap || []} />

        <Card {...cardAnim}>
          <Title>
            <h3>Top attendance</h3>
            <span>Leaderboard (top 10)</span>
          </Title>
          <Table>
            {(analytics?.leaderboardTop || []).map((r) => (
              <Row key={r.studentId}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.studentName}
                  </div>
                  <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                    {r.attendanceRate}% • {r.present + r.late}/{r.totalDays} days
                  </div>
                  <BarWrap>
                    <BarFill $p={r.attendanceRate} $kind="good" />
                  </BarWrap>
                </div>
                <div style={{ textAlign: 'right', fontWeight: theme.fontWeights.bold }}>{r.attendanceRate}%</div>
              </Row>
            ))}
          </Table>
        </Card>
      </div>

      <Card {...cardAnim}>
        <Title>
          <h3>Most absent</h3>
          <span>Quick identification (top 10)</span>
        </Title>
        <Table>
          {(analytics?.mostAbsent || []).map((r) => (
            <Row key={r.studentId}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: theme.fontWeights.semibold, color: theme.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.studentName}
                </div>
                <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                  Absent {r.absent}/{r.totalDays} • {r.attendanceRate}% rate
                </div>
                <BarWrap>
                  <BarFill $p={clamp(100 - r.attendanceRate, 0, 100)} $kind="bad" />
                </BarWrap>
              </div>
              <div style={{ textAlign: 'right', fontWeight: theme.fontWeights.bold }}>{r.absent}</div>
            </Row>
          ))}
        </Table>
      </Card>
    </Page>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

