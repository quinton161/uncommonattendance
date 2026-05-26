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
import { attendanceAnalyticsService } from '../../services/attendanceAnalyticsService';
import { AdminAnalytics } from '../../services/attendanceAnalyticsService';
import type { DateRange } from '../../services/attendanceAnalyticsService';
import { theme } from '../../styles/theme';
import { DateRangeFilter } from './DateRangeFilter';
import { AttendanceHeatmap } from './AttendanceHeatmap';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { effectiveStaffHubScope, initialStaffHubFilter } from '../../services/hubService';
import { AdminHubScopeSelect } from '../Admin/AdminHubScopeSelect';
import { AttendanceService } from '../../services/attendanceService';
import { uniqueToast } from '../../utils/toastUtils';
import { Button } from '../Common/Button';
import { FiAlertTriangle } from 'react-icons/fi';

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

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const FieldLabel = styled.label`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  font-weight: ${theme.fontWeights.medium};
`;

const Summary = styled.p`
  margin: ${theme.spacing.md} 0 0 0;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;

const WarningText = styled.span`
  color: ${theme.colors.warning};
`;

const RowDetail = styled.div`
  min-width: 0;
`;

const RowTitle = styled.div`
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowSubtitle = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;

const RowValue = styled.div`
  text-align: right;
  font-weight: ${theme.fontWeights.bold};
`;

const EmptyMessage = styled.div`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

const DangerHeading = styled.h3`
  color: #b91c1c;
`;

const ModalText = styled.p`
  margin: 0 0 ${theme.spacing.md} 0;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

const DangerOutlineButton = styled(Button)`
  border-color: #dc2626;
  color: #dc2626;
`;

const DangerSolidButton = styled(Button)`
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
`;

const ModalHeading = styled.h3`
  margin: 0 0 ${theme.spacing.sm} 0;
  color: ${theme.colors.textPrimary};
`;

const ModalWarning = styled(ModalText)`
  color: ${theme.colors.warning};
  margin-bottom: 0;
`;

const DangerIcon = styled(FiAlertTriangle)`
  margin-right: 8px;
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
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.desktop}) {
    grid-template-columns: minmax(0, 1fr);
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

const DangerCard = styled(Card)`
  border-color: rgba(220, 38, 38, 0.35);
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.6) 0%, ${theme.colors.white} 100%);
`;

const ResetModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
`;

const ResetModalBox = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  max-width: 440px;
  width: 100%;
  box-shadow: ${theme.shadows.xl};
`;

const ResetInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 2px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSizes.sm};
  margin-top: ${theme.spacing.sm};
  box-sizing: border-box;
`;

const ChartContainer = styled.div`
  width: 100%;
  min-width: 0;
  min-height: 280px;
  height: clamp(280px, 36vh, 400px);
`;

function fmtShort(dateIso: string) {
  try {
    return format(parseISO(dateIso), 'MMM d');
  } catch {
    return dateIso;
  }
}

export function AdminAttendanceAnalytics(): React.ReactElement {
  const { user } = useAuth();
  const [adminHubFilter, setAdminHubFilter] = useState(() => initialStaffHubFilter(user));
  const effectiveHub = useMemo(
    () => effectiveStaffHubScope(user, adminHubFilter),
    [user, adminHubFilter]
  );
  const dataService = DataService.getInstance();
  const canClearAttendance = user?.userType === 'admin';

  const [range, setRange] = useState<DateRange>(() => attendanceAnalyticsService.getDefaultRange('admin'));
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const cardAnim = useMemo(
    () => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }),
    []
  );

  const roster = useMemo(
    () =>
      students.map((s: any) => ({
        studentId: s.uid || s.id,
        studentName: s.displayName || s.email || 'Student',
      })),
    [students]
  );

  useEffect(() => {
    (async () => {
      await dataService.testConnection();
      const users = await dataService.getUsers(effectiveHub);
      // Treat missing userType as a student for backward-compat.
      setStudents(users.filter((u: any) => !u.userType || u.userType === 'attendee'));
    })();
  }, [dataService, effectiveHub]);

  // If a preset was selected (not Custom), normalize to concrete Harare-aligned dates.
  useEffect(() => {
    if (range.preset?.value && range.preset.value !== 'custom') {
      setRange(attendanceAnalyticsService.presetToRange(range.preset));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.preset]);

  // Real-time: when any student checks in, aggregates update without refresh.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const opts =
      selectedStudentId !== 'all'
        ? { studentId: selectedStudentId, hubId: effectiveHub }
        : { totalStudents: students.length, roster, hubId: effectiveHub };

    const unsubscribe = attendanceAnalyticsService.subscribeToAdminAnalytics(
      range,
      (res: AdminAnalytics) => {
        if (!mounted) return;
        setAnalytics(res);
        setLoading(false);
      },
      opts
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [range.startDate, range.endDate, selectedStudentId, students.length, roster, effectiveHub]);

  const dailyData =
    (analytics?.daily || []).map((d: { date: string; present: number; late: number; absent: number }) => ({
      name: fmtShort(d.date),
      present: d.present,
      late: d.late,
      absent: d.absent,
    })) || [];

  const pieData = analytics?.distribution || [];
  const heatmapCells = (analytics?.heatmap || []).map((h: { date: string; count: number }) => ({
    date: h.date,
    value: h.count,
    label: `${h.count} records`
  }));
  const leaderboard = analytics?.leaderboardTop || [];
  const mostAbsent = analytics?.mostAbsent || [];

  const totals = analytics?.totals;
  const attendanceRate = analytics && 'attendanceRate' in analytics ? (analytics as any).attendanceRate : 0;
  const totalDays = totals?.totalDays ?? 0;
  const tp = totals?.present ?? 0;
  const tl = totals?.late ?? 0;
  const ta = totals?.absent ?? 0;
  const enrolled = students.length;
  /** All-student view: backend totals are student-days (sum over weekdays). Show averages so they match ~enrollment. */
  const overviewAll = selectedStudentId === 'all' && totalDays > 0 && enrolled > 0;
  const avgOnTime = overviewAll ? tp / totalDays : 0;
  const avgLate = overviewAll ? tl / totalDays : 0;
  const avgAbsent = overviewAll ? ta / totalDays : 0;
  const studentDaysTotal = tp + tl + ta;
  const expectedStudentDays = overviewAll ? enrolled * totalDays : 0;

  const COLORS = {
    present: '#22c55e',
    late: '#f59e0b',
    absent: '#ef4444',
  };

  return (
    <Page>
      <FilterRow>
        <AdminHubScopeSelect
          user={user}
          value={adminHubFilter}
          onChange={setAdminHubFilter}
          id="analytics-hub-filter"
        />
        <DateRangeFilter
          value={range}
          onChange={setRange}
          presets={[
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Quarter', value: 'quarter' },
            { label: 'Custom', value: 'custom' },
          ]}
        />
        <FilterField>
          <FieldLabel htmlFor="student-filter">Student</FieldLabel>
          <Select id="student-filter" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
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
        </FilterField>
      </FilterRow>

      <Card {...cardAnim}>
        <Title>
          <h3>Overview</h3>
          <span>
            {loading
              ? 'Updating…'
              : `${range.startDate} → ${range.endDate}${
                  selectedStudentId === 'all' && enrolled > 0 ? ` · ${enrolled} students enrolled` : ''
                }`}
          </span>
        </Title>
        <StatRow>
          <Stat
            $grad={`linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.primaryLight}18 100%)`}
          >
            <div className="v">{attendanceRate}%</div>
            <div className="l">
              {selectedStudentId === 'all'
                ? 'Avg. daily attendance (checked in ÷ enrolled, by day)'
                : 'Attendance rate (weekdays)'}
            </div>
          </Stat>
          <Stat
            $grad={`linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.18) 100%)`}
          >
            <div className="v">
              {overviewAll ? avgOnTime.toFixed(1) : tp}
            </div>
            <div className="l">
              {overviewAll ? 'On time / weekday (avg.)' : 'Weekdays on time'}
            </div>
          </Stat>
          <Stat
            $grad={`linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.18) 100%)`}
          >
            <div className="v">
              {overviewAll ? avgLate.toFixed(1) : tl}
            </div>
            <div className="l">
              {overviewAll ? 'Late / weekday (avg.)' : 'Weekdays late'}
            </div>
          </Stat>
          <Stat
            $grad={`linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.18) 100%)`}
          >
            <div className="v">
              {overviewAll ? avgAbsent.toFixed(1) : ta}
            </div>
            <div className="l">
              {overviewAll ? 'Absent / weekday (avg.)' : 'Weekdays absent'}
            </div>
          </Stat>
        </StatRow>
        {overviewAll && (
          <Summary>
            {totalDays} weekdays · {enrolled} enrolled. Cards show <strong>average students per weekday</strong>; three
            averages should sum to ~{enrolled} (here {(avgOnTime + avgLate + avgAbsent).toFixed(1)}). Raw student-days in
            range: {tp} on-time + {tl} late + {ta} absent = {studentDaysTotal}
            {expectedStudentDays > 0 ? ` (expected ${enrolled}×${totalDays}=${expectedStudentDays})` : ''}.
            {expectedStudentDays > 0 && studentDaysTotal !== expectedStudentDays && (
              <WarningText> If this doesn’t match, check for duplicate attendance rows.</WarningText>
            )}
          </Summary>
        )}
      </Card>

      <TwoCol>
        <Card {...cardAnim}>
          <Title>
            <h3>Daily trend</h3>
            <span>Hover for exact values</span>
          </Title>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
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
            <span>
              {selectedStudentId === 'all'
                ? 'Share of all student-days (on time vs late vs absent)'
                : 'Present vs late vs absent'}
            </span>
          </Title>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <PieChart>
                <Tooltip />
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {pieData.map((entry: { name: string; value: number }) => (
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
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
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
            <span>Best weekday attendance % in this range (top 10)</span>
          </Title>
          <Table>
            {leaderboard.map((r: { studentId: string; studentName: string; attendanceRate: number; present: number; late: number; totalDays: number }) => (
              <Row key={r.studentId}>
                <RowDetail>
                  <RowTitle>{r.studentName}</RowTitle>
                  <RowSubtitle>{r.attendanceRate}% • {r.present + r.late}/{r.totalDays} days</RowSubtitle>
                  <BarWrap>
                    <BarFill $p={r.attendanceRate} $kind="good" />
                  </BarWrap>
                </RowDetail>
                <RowValue>{r.attendanceRate}%</RowValue>
              </Row>
            ))}
            {leaderboard.length === 0 && (
              <EmptyMessage>
                {selectedStudentId !== 'all'
                  ? 'Switch to “All students” to see the cohort leaderboard.'
                  : students.length === 0
                    ? 'Loading students…'
                    : 'No weekdays in this range, or not enough data yet.'}
              </EmptyMessage>
            )}
          </Table>
        </Card>
      </TwoCol>

      <Card {...cardAnim}>
        <Title>
          <h3>Most absent</h3>
          <span>Most missed weekdays in this range (top 10)</span>
        </Title>
        <Table>
          {mostAbsent.map((r: { userId: string; userName: string; absent: number; attendanceRate: number }) => (
            <Row key={r.userId}>
              <RowDetail>
                <RowTitle>{r.userName}</RowTitle>
                <RowSubtitle>Absent {r.absent} days • {r.attendanceRate}% rate</RowSubtitle>
                <BarWrap>
                  <BarFill $p={Math.round(100 - r.attendanceRate)} $kind="bad" />
                </BarWrap>
              </RowDetail>
              <RowValue>{r.absent}</RowValue>
            </Row>
          ))}
          {mostAbsent.length === 0 && (
            <EmptyMessage>
              {selectedStudentId !== 'all'
                ? 'Switch to “All students” to see absentee rankings.'
                : students.length === 0
                  ? 'Loading students…'
                  : 'No weekdays in this range, or not enough data yet.'}
            </EmptyMessage>
          )}
        </Table>
      </Card>

      {canClearAttendance && (
        <DangerCard {...cardAnim}>
          <Title>
            <DangerHeading>Reset attendance data</DangerHeading>
            <span>Start fresh — analytics will show zeros</span>
          </Title>
          <ModalText>
            Deletes attendance and daily summary rows for the <strong>selected hub only</strong> (choose a hub in the filter above). Student accounts
            are not removed. This cannot be undone.
          </ModalText>
          {!effectiveHub ? (
            <ModalWarning>
              Select a single hub to enable this action (not &quot;All hubs&quot;).
            </ModalWarning>
          ) : null}
          <DangerOutlineButton
            type="button"
            variant="outline"
            disabled={!effectiveHub}
            onClick={() => {
              setResetConfirm('');
              setShowResetModal(true);
            }}
          >
            <DangerIcon size={16} aria-hidden />
            Clear this hub’s attendance records…
          </DangerOutlineButton>
        </DangerCard>
      )}

      {showResetModal && (
        <ResetModalOverlay>
          <ResetModalBox>
            <ModalHeading>Confirm hub attendance reset</ModalHeading>
            <ModalText>
              Type <strong>RESET</strong> to permanently delete attendance and daily summaries for this hub only.
            </ModalText>
            <ResetInput
              autoComplete="off"
              placeholder="RESET"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
            />
            <ModalActions>
              <Button variant="outline" type="button" disabled={resetLoading} onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <DangerSolidButton
                type="button"
                disabled={resetConfirm !== 'RESET' || resetLoading}
                onClick={async () => {
                  if (!effectiveHub) return;
                  setResetLoading(true);
                  try {
                    const attendanceService = AttendanceService.getInstance();
                    const result = await attendanceService.masterResetAttendance(effectiveHub);
                    uniqueToast.success(
                      `Removed ${result.deletedCount} attendance + ${result.deletedDaily} daily records (this hub). Reloading…`,
                      { autoClose: 3500 }
                    );
                    setShowResetModal(false);
                    window.setTimeout(() => window.location.reload(), 600);
                  } catch (e) {
                    console.error(e);
                    uniqueToast.error('Could not reset attendance. Check Firestore rules and your connection.');
                    setResetLoading(false);
                  }
                }}
              >
                {resetLoading ? 'Deleting…' : 'Delete this hub’s attendance'}
              </DangerSolidButton>
            </ModalActions>
          </ResetModalBox>
        </ResetModalOverlay>
      )}
    </Page>
  );
}

