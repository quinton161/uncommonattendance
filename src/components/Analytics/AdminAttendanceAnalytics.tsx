import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
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

import DataService from '../../services/DataService';
import { attendanceAnalyticsService, AdminAnalytics, DateRange } from '../../services/attendanceAnalyticsService';
import { theme } from '../../styles/theme';
import { DateRangeFilter } from './DateRangeFilter';
import { AttendanceHeatmap } from './AttendanceHeatmap';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const FilterRow = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: flex-end;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.white};
  font-size: ${theme.fontSizes.sm};
  min-height: 40px;
  color: ${theme.colors.textPrimary};
  width: 260px;
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
    font-weight: ${theme.fontWeights.semibold};
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

const Stat = styled.div<{ $grad: string }>`
  background: ${({ $grad }) => $grad};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid rgba(0,0,0,0.04);
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

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: ${theme.spacing.md};
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.gray50};
  border: 1px solid ${theme.colors.gray100};
`;

const BarWrap = styled.div`
  height: 8px;
  border-radius: 999px;
  background: ${theme.colors.gray200};
  overflow: hidden;
  margin-top: ${theme.spacing.xs};
`;

const BarFill = styled.div<{ $p: number; $kind: 'good' | 'bad' }>`
  height: 100%;
  width: ${({ $p }) => `${Math.max(0, Math.min(100, $p))}%`};
  background: ${({ $kind }) =>
    $kind === 'good'
      ? `linear-gradient(90deg, ${theme.colors.success}, #16a34a)`
      : `linear-gradient(90deg, #ef4444, ${theme.colors.error})`};
  transition: width 0.5s ease;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: clamp(220px, 34vh, 360px);
  min-width: 0;
  min-height: 0;
`;

function fmtShort(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdminAttendanceAnalytics(): React.ReactElement {
  const dataService = DataService.getInstance();

  const [range, setRange] = useState<DateRange>(attendanceAnalyticsService.getDefaultRange('month'));
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const cardAnim = useMemo(
    () => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }),
    []
  );

  useEffect(() => {
    (async () => {
      await dataService.testConnection();
      const users = await dataService.getUsers();
      // Treat missing userType as a student for backward-compat.
      setStudents(users.filter((u: any) => !u.userType || u.userType === 'attendee'));
    })();
  }, [dataService]);

  // If a preset was selected, normalize to concrete dates.
  useEffect(() => {
    if (range.preset !== 'custom') {
      setRange(attendanceAnalyticsService.getDefaultRange(range.preset));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.preset]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    attendanceAnalyticsService
      .getAdminAnalytics(range, { studentId: selectedStudentId === 'all' ? undefined : selectedStudentId })
      .then((res) => {
        if (!mounted) return;
        setAnalytics(res);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAnalytics(null);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [range.startDate, range.endDate, selectedStudentId]);

  const dailyData =
    (analytics?.daily || []).map((d) => ({
      name: fmtShort(d.date),
      present: d.present,
      late: d.late,
      absent: d.absent,
    })) || [];

  const pieData = analytics?.distribution || [];
  const heatmapCells = analytics?.heatmap || [];
  const leaderboard = analytics?.leaderboardTop || [];
  const mostAbsent = analytics?.mostAbsent || [];

  const totals = analytics?.totals;
  const attendanceRate = Math.round(totals?.attendanceRate || 0);

  const COLORS = {
    present: '#22c55e',
    late: '#f59e0b',
    absent: '#ef4444',
  };

  return (
    <Page>
      <FilterRow>
        <DateRangeFilter value={range} onChange={setRange} presets={['month']} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <label style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary, fontWeight: theme.fontWeights.medium }}>
            Student
          </label>
          <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
            <option value="all">All students</option>
            {students.map((s: any) => {
              const id = s.uid || s.id;
              return (
                <option key={id} value={id}>
                  {s.displayName || s.email || id}
                </option>
              );
            })}
          </Select>
        </div>
      </FilterRow>

      <Card {...cardAnim}>
        <Title>
          <h3>Overview</h3>
          <span>{loading ? 'Updating…' : `${range.startDate} → ${range.endDate}`}</span>
        </Title>
        <StatRow>
          <Stat
            $grad={`linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.primaryLight}18 100%)`}
          >
            <div className="v">{attendanceRate}%</div>
            <div className="l">Attendance rate</div>
          </Stat>
          <Stat
            $grad={`linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.18) 100%)`}
          >
            <div className="v">{totals?.present ?? 0}</div>
            <div className="l">Present</div>
          </Stat>
          <Stat
            $grad={`linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.18) 100%)`}
          >
            <div className="v">{totals?.late ?? 0}</div>
            <div className="l">Late</div>
          </Stat>
          <Stat
            $grad={`linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.18) 100%)`}
          >
            <div className="v">{totals?.absent ?? 0}</div>
            <div className="l">Absent</div>
          </Stat>
        </StatRow>
      </Card>

      <TwoCol>
        <Card {...cardAnim}>
          <Title>
            <h3>Daily trend</h3>
            <span>Hover for exact values</span>
          </Title>
          <ChartContainer>
            <ResponsiveContainer>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" name="Present" stroke={COLORS.present} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="late" name="Late" stroke={COLORS.late} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke={COLORS.absent} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        <Card {...cardAnim}>
          <Title>
            <h3>Distribution</h3>
            <span>Present vs late vs absent</span>
          </Title>
          <ChartContainer>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === 'Present' ? COLORS.present : entry.name === 'Late' ? COLORS.late : COLORS.absent
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </TwoCol>

      <Card {...cardAnim}>
        <Title>
          <h3>Stacked comparison</h3>
          <span>Present / late / absent per day</span>
        </Title>
        <ChartContainer>
          <ResponsiveContainer>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" stackId="a" name="Present" fill={COLORS.present} radius={[6, 6, 0, 0]} />
              <Bar dataKey="late" stackId="a" name="Late" fill={COLORS.late} />
              <Bar dataKey="absent" stackId="a" name="Absent" fill={COLORS.absent} radius={[0, 0, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      <TwoCol>
        <AttendanceHeatmap title="Low-attendance heatmap" cells={heatmapCells} />

        <Card {...cardAnim}>
          <Title>
            <h3>Top attendance</h3>
            <span>Leaderboard (top 10)</span>
          </Title>
          <Table>
            {leaderboard.map((r) => (
              <Row key={r.studentId}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: theme.fontWeights.semibold,
                      color: theme.colors.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.studentName}
                  </div>
                  <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                    {r.attendanceRate}% • {r.present + r.late}/{r.totalDays} days
                  </div>
                  <BarWrap>
                    <BarFill $p={r.attendanceRate} $kind="good" />
                  </BarWrap>
                </div>
                <div style={{ textAlign: 'right', fontWeight: theme.fontWeights.bold }}>
                  {r.attendanceRate}%
                </div>
              </Row>
            ))}
            {leaderboard.length === 0 && <div style={{ color: theme.colors.textSecondary }}>No data.</div>}
          </Table>
        </Card>
      </TwoCol>

      <Card {...cardAnim}>
        <Title>
          <h3>Most absent</h3>
          <span>Quick identification (top 10)</span>
        </Title>
        <Table>
          {mostAbsent.map((r) => (
            <Row key={r.studentId}>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: theme.fontWeights.semibold,
                    color: theme.colors.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.studentName}
                </div>
                <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                  Absent {r.absent}/{r.totalDays} • {r.attendanceRate}% rate
                </div>
                <BarWrap>
                  <BarFill $p={Math.round(100 - r.attendanceRate)} $kind="bad" />
                </BarWrap>
              </div>
              <div style={{ textAlign: 'right', fontWeight: theme.fontWeights.bold }}>{r.absent}</div>
            </Row>
          ))}
          {mostAbsent.length === 0 && <div style={{ color: theme.colors.textSecondary }}>No data.</div>}
        </Table>
      </Card>
    </Page>
  );
}

