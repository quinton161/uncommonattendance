import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { theme } from '../../styles/theme';
import { uniqueToast } from '../../utils/toastUtils';
import DataService from '../../services/DataService';
import { resolvedHubLabel } from '../../services/hubService';
import { TimeService } from '../../services/timeService';
import type { DailyGoal, GoalStatus, WeeklyGoal } from '../../types/studentGoals';
import { GOAL_STATUS_LABEL } from '../../types/studentGoals';
import {
  addDailyGoal,
  addWeeklyGoal,
  computeWeeklyProgress,
  deleteDailyGoal,
  deleteWeeklyGoalCascade,
  sortDailiesByDate,
  subscribeDailyGoals,
  subscribeWeeklyGoals,
  updateDailyGoal,
  updateWeeklyGoal,
} from '../../services/studentGoalsService';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import { UncommonLogo } from '../Common/UncommonLogo';

const PageShell = styled.div`
  width: 100%;
  min-height: 100%;
  background: linear-gradient(180deg, ${theme.colors.gray50} 0%, ${theme.colors.backgroundSecondary} 40%, ${theme.colors.gray50} 100%);
`;

const Page = styled.div`
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  padding-bottom: ${theme.spacing['2xl']};
  box-sizing: border-box;
  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const Hero = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 55%, #0a1628 100%);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.xl} ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.lg};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: -40px;
    top: -40px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    pointer-events: none;
  }
`;

const HeroTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const HeroTitleBlock = styled.div`
  color: ${theme.colors.white};
`;

const HeroEyebrow = styled.p`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.85;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.white};
  font-family: ${theme.fonts.heading};
  line-height: 1.15;
  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes['2xl']};
  }
`;

const Sub = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSizes.sm};
  color: rgba(255, 255, 255, 0.88);
  max-width: 36rem;
  line-height: 1.55;
`;

const LogoWrap = styled.div`
  background: rgba(255, 255, 255, 0.12);
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: 1px solid rgba(255, 255, 255, 0.2);
  & * {
    color: ${theme.colors.white} !important;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  @media (max-width: ${theme.breakpoints.laptop}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $accent: 'primary' | 'success' | 'warning' | 'danger' }>`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  box-shadow: ${theme.shadows.md};
  border: 1px solid ${theme.colors.gray200};
  border-left: 4px solid
    ${(p) =>
      p.$accent === 'primary'
        ? theme.colors.primary
        : p.$accent === 'success'
          ? theme.colors.success
          : p.$accent === 'warning'
            ? theme.colors.warning
            : theme.colors.danger};
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  }
`;

const StatIcon = styled.div<{ $accent: 'primary' | 'success' | 'warning' | 'danger' }>`
  width: 44px;
  height: 44px;
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${(p) =>
    p.$accent === 'primary'
      ? 'rgba(0, 82, 204, 0.12)'
      : p.$accent === 'success'
        ? 'rgba(39, 174, 96, 0.12)'
        : p.$accent === 'warning'
          ? 'rgba(243, 156, 18, 0.15)'
          : 'rgba(231, 76, 60, 0.12)'};
  color: ${(p) =>
    p.$accent === 'primary'
      ? theme.colors.primary
      : p.$accent === 'success'
        ? theme.colors.success
        : p.$accent === 'warning'
          ? theme.colors.warning
          : theme.colors.danger};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.heading};
  line-height: 1.1;
`;

const Card = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.md};
  margin-bottom: ${theme.spacing.xl};
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
  }
`;

const CardTitle = styled.h2`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.xl};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.heading};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const SectionHeading = styled.h2`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.xl};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.heading};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const FormGrid = styled.div`
  display: grid;
  gap: ${theme.spacing.md};
  @media (min-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textPrimary};
`;

const inputFocus = `
  outline: none;
  border-color: ${theme.colors.primary};
  box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.15);
`;

const Input = styled.input`
  padding: ${theme.spacing.md} ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    ${inputFocus}
  }
`;

const TextArea = styled.textarea`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  min-height: 88px;
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    ${inputFocus}
  }
`;

const Select = styled.select`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.gray300};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  background: ${theme.colors.white};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    ${inputFocus}
  }
`;

const ProgressTrack = styled.div`
  height: 10px;
  background: ${theme.colors.gray100};
  border-radius: ${theme.borderRadius.full};
  overflow: hidden;
  margin-top: ${theme.spacing.sm};
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: linear-gradient(90deg, ${theme.colors.primary} 0%, #2684ff 100%);
  border-radius: ${theme.borderRadius.full};
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Badge = styled.span<{ $t: GoalStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  background: ${(p) =>
    p.$t === 'completed' ? 'rgba(39, 174, 96, 0.12)' : p.$t === 'in_progress' ? 'rgba(0, 82, 204, 0.1)' : theme.colors.gray100};
  color: ${(p) =>
    p.$t === 'completed' ? theme.colors.success : p.$t === 'in_progress' ? theme.colors.primary : theme.colors.textSecondary};
  border: 1px solid
    ${(p) =>
      p.$t === 'completed' ? 'rgba(39, 174, 96, 0.25)' : p.$t === 'in_progress' ? 'rgba(0, 82, 204, 0.2)' : theme.colors.gray200};
`;

const WeeklyGoalCard = styled.div<{ $status: GoalStatus; $overdue?: boolean }>`
  border: 1px solid ${theme.colors.gray200};
  border-left: 5px solid
    ${(p) =>
      p.$overdue
        ? theme.colors.danger
        : p.$status === 'completed'
          ? theme.colors.success
          : p.$status === 'in_progress'
            ? theme.colors.primary
            : theme.colors.gray400};
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
  background: ${theme.colors.white};
  box-shadow: ${theme.shadows.sm};
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: ${theme.shadows.md};
  }
`;

const PctBadge = styled.div`
  min-width: 4rem;
  text-align: right;
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  font-family: ${theme.fonts.heading};
  color: ${theme.colors.primary};
  line-height: 1;
`;

const DailyGoalCard = styled.div<{ $overdue?: boolean }>`
  border: 1px solid ${(p) => (p.$overdue ? 'rgba(231, 76, 60, 0.35)' : theme.colors.gray200)};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
  background: ${(p) => (p.$overdue ? 'rgba(231, 76, 60, 0.04)' : theme.colors.gray50)};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${theme.spacing.sm};
  justify-content: space-between;
`;

const RowBtns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${theme.zIndex.modal};
  padding: ${theme.spacing.md};
`;

const ModalPanel = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius['2xl']};
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
  border: 1px solid ${theme.colors.gray200};
  position: relative;
  &::before {
    content: '';
    display: block;
    height: 5px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
    border-radius: ${theme.borderRadius['2xl']} ${theme.borderRadius['2xl']} 0 0;
  }
`;

const ModalBody = styled.div`
  padding: ${theme.spacing.xl};
`;

const ModalTitle = styled.h3`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.fontSizes.xl};
  font-family: ${theme.fonts.heading};
  color: ${theme.colors.textPrimary};
`;

const EmptyHint = styled.div`
  text-align: center;
  padding: ${theme.spacing['2xl']};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSizes.sm};
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  border: 1px dashed ${theme.colors.gray300};
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};
  font-size: ${theme.fontSizes.sm};
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.sm};
`;

const TodayStrip = styled.div`
  background: linear-gradient(135deg, rgba(0, 82, 204, 0.08) 0%, rgba(0, 61, 153, 0.06) 100%);
  border: 1px solid rgba(0, 82, 204, 0.2);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.sm};
`;

const TodayTitle = styled.div`
  font-weight: ${theme.fontWeights.bold};
  font-family: ${theme.fonts.heading};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSizes.lg};
`;

const TodayRow = styled.div`
  font-size: ${theme.fontSizes.sm};
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.gray200};
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const StaffStudentCard = styled.div`
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  background: ${theme.colors.white};
  box-shadow: ${theme.shadows.md};
`;

const StaffHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.gray100};
`;

const StaffName = styled.div`
  font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.lg};
  color: ${theme.colors.textPrimary};
  font-family: ${theme.fonts.heading};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const StaffMeta = styled.span`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.normal};
  color: ${theme.colors.textSecondary};
`;

const StaffProgressPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(0, 82, 204, 0.1);
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.sm};
`;

const HubChip = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.primaryDark};
  background: rgba(0, 82, 204, 0.1);
  padding: 4px 10px;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid rgba(0, 82, 204, 0.2);
  margin-top: ${theme.spacing.xs};
`;

export interface StudentGoalsBoardProps {
  /** When set, staff sees students in this hub (instructors always use their hub). */
  hubScopeId?: string | null;
  /**
   * Admins only: when true with `hubScopeId` unset, load students from every hub.
   * Instructors should leave this false; they only ever see their hub.
   */
  viewAllHubs?: boolean;
}

const STATUS_OPTIONS: GoalStatus[] = ['pending', 'in_progress', 'completed'];

function isOverdueDaily(d: DailyGoal, today: string): boolean {
  return d.date < today && d.status !== 'completed';
}

function isOverdueWeekly(w: WeeklyGoal, today: string): boolean {
  return w.weekEnd < today && w.status !== 'completed';
}

export const StudentGoalsBoard: React.FC<StudentGoalsBoardProps> = ({ hubScopeId, viewAllHubs = false }) => {
  const { user } = useAuth();
  const time = useMemo(() => TimeService.getInstance(), []);
  const todayStr = useMemo(() => time.getCurrentDateString(), [time]);

  const isStaff = user?.userType === 'instructor' || user?.userType === 'admin';
  const isAdmin = user?.userType === 'admin';
  const isStudent = user?.userType === 'attendee';
  const adminAllHubs = Boolean(isAdmin && viewAllHubs);
  const staffMode = isStaff && (Boolean(hubScopeId) || adminAllHubs);

  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [studentHubLabels, setStudentHubLabels] = useState<Record<string, string>>({});
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [staffWeeklies, setStaffWeeklies] = useState<Record<string, WeeklyGoal[]>>({});
  const [dailyMap, setDailyMap] = useState<Record<string, DailyGoal[]>>({});
  const [staffDailyMap, setStaffDailyMap] = useState<Record<string, Record<string, DailyGoal[]>>>({});
  const [expandedWeekIds, setExpandedWeekIds] = useState<string[]>([]);
  const [staffExpanded, setStaffExpanded] = useState<Record<string, string[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [weeklyForm, setWeeklyForm] = useState({
    title: '',
    description: '',
    weekStart: '',
    weekEnd: '',
    status: 'pending' as GoalStatus,
  });

  const [dailyModal, setDailyModal] = useState<{
    weeklyId: string;
    edit?: DailyGoal | null;
  } | null>(null);
  const [dailyForm, setDailyForm] = useState({
    title: '',
    description: '',
    date: todayStr,
    status: 'pending' as GoalStatus,
  });

  const userId = user?.uid ?? '';

  useEffect(() => {
    if (!staffMode) {
      setStudentIds([]);
      setStudentNames({});
      setStudentHubLabels({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let users: any[];
        if (adminAllHubs) {
          users = await DataService.getInstance().getUsers(undefined);
        } else if (hubScopeId) {
          users = await DataService.getInstance().getUsers(hubScopeId);
        } else {
          if (!cancelled) {
            setStudentIds([]);
            setStudentNames({});
            setStudentHubLabels({});
          }
          return;
        }
        if (cancelled) return;
        const attendees = users.filter(
          (u: { userType?: string }) => !u.userType || u.userType === 'attendee'
        );
        const names: Record<string, string> = {};
        const hubs: Record<string, string> = {};
        attendees.forEach((u: { uid?: string; id?: string; displayName?: string; hubId?: string; hubName?: string }) => {
          const id = String(u.uid || u.id);
          names[id] = u.displayName || id;
          hubs[id] = resolvedHubLabel(u);
        });
        const ids = attendees.map((u: { uid?: string; id?: string }) => String(u.uid || u.id)).filter(Boolean);
        const sortedIds = [...ids].sort((a, b) => {
          const dh = (hubs[a] || '').localeCompare(hubs[b] || '');
          if (dh !== 0) return dh;
          return (names[a] || '').localeCompare(names[b] || '');
        });
        setStudentIds(sortedIds);
        setStudentNames(names);
        setStudentHubLabels(hubs);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load students');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffMode, hubScopeId, adminAllHubs]);

  useEffect(() => {
    if (!userId || staffMode) return;
    setLoading(true);
    const unsub = subscribeWeeklyGoals(userId, (goals, err) => {
      if (err) {
        setError(err.message);
        setWeeklyGoals([]);
      } else {
        setError(null);
        setWeeklyGoals(goals);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [userId, staffMode]);

  useEffect(() => {
    if (!staffMode || !studentIds.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubs = studentIds.map((sid) =>
      subscribeWeeklyGoals(sid, (goals, err) => {
        if (err) {
          setError(err.message);
        } else {
          setStaffWeeklies((prev) => ({ ...prev, [sid]: goals }));
          setError(null);
        }
        setLoading(false);
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [staffMode, studentIds]);

  const weeklyIdsKey = useMemo(() => weeklyGoals.map((w) => w.id).sort().join(','), [weeklyGoals]);

  useEffect(() => {
    if (!userId || staffMode) return;
    if (!weeklyGoals.length) {
      setDailyMap({});
      return;
    }
    const unsubs = weeklyGoals.map((w) =>
      subscribeDailyGoals(userId, w.id, (dals, err) => {
        if (err) {
          uniqueToast.error(err.message);
          return;
        }
        setDailyMap((prev) => ({ ...prev, [w.id]: dals }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [userId, staffMode, weeklyIdsKey]);

  const staffDailyWatchKey = useMemo(
    () =>
      Object.entries(staffExpanded)
        .map(([sid, wids]) => `${sid}:${[...(wids as string[])].sort().join(',')}`)
        .sort()
        .join('|'),
    [staffExpanded]
  );

  useEffect(() => {
    if (!staffMode) return;
    const unsubs: Array<() => void> = [];
    Object.entries(staffExpanded).forEach(([sid, wids]) => {
      (wids as string[]).forEach((wid) => {
        unsubs.push(
          subscribeDailyGoals(sid, wid, (dals, err) => {
            if (!err) {
              setStaffDailyMap((prev) => ({
                ...prev,
                [sid]: { ...(prev[sid] || {}), [wid]: dals },
              }));
            }
          })
        );
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [staffMode, staffDailyWatchKey]);

  const toggleExpand = (wid: string) => {
    setExpandedWeekIds((prev) =>
      prev.includes(wid) ? prev.filter((x) => x !== wid) : [...prev, wid]
    );
  };

  const toggleStaffExpand = (sid: string, wid: string) => {
    setStaffExpanded((prev) => {
      const cur = prev[sid] || [];
      const next = cur.includes(wid) ? cur.filter((x) => x !== wid) : [...cur, wid];
      return { ...prev, [sid]: next };
    });
  };

  const handleAddWeekly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !weeklyForm.title.trim()) {
      uniqueToast.error('Title is required');
      return;
    }
    if (!weeklyForm.weekStart || !weeklyForm.weekEnd) {
      uniqueToast.error('Week start and end dates are required');
      return;
    }
    setSaving(true);
    try {
      await addWeeklyGoal(userId, {
        title: weeklyForm.title,
        description: weeklyForm.description,
        weekStart: weeklyForm.weekStart,
        weekEnd: weeklyForm.weekEnd,
        status: weeklyForm.status,
      });
      uniqueToast.success('Weekly goal added');
      setWeeklyForm({
        title: '',
        description: '',
        weekStart: '',
        weekEnd: '',
        status: 'pending',
      });
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Failed to add goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWeekly = async (wid: string) => {
    if (!userId) return;
    if (!window.confirm('Delete this weekly goal and all its daily goals?')) return;
    try {
      await deleteWeeklyGoalCascade(userId, wid);
      setExpandedWeekIds((p) => p.filter((x) => x !== wid));
      uniqueToast.success('Weekly goal deleted');
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const openDailyModal = (weeklyId: string, edit?: DailyGoal) => {
    if (edit) {
      setDailyForm({
        title: edit.title,
        description: edit.description,
        date: edit.date,
        status: edit.status,
      });
    } else {
      setDailyForm({ title: '', description: '', date: todayStr, status: 'pending' });
    }
    setDailyModal({ weeklyId, edit: edit || null });
  };

  const submitDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !dailyModal) return;
    if (!dailyForm.title.trim()) {
      uniqueToast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (dailyModal.edit) {
        await updateDailyGoal(userId, dailyModal.weeklyId, dailyModal.edit.id, {
          title: dailyForm.title,
          description: dailyForm.description,
          date: dailyForm.date,
          status: dailyForm.status,
        });
        uniqueToast.success('Daily goal updated');
      } else {
        await addDailyGoal(userId, dailyModal.weeklyId, {
          title: dailyForm.title,
          description: dailyForm.description,
          date: dailyForm.date,
          status: dailyForm.status,
        });
        uniqueToast.success('Daily goal added');
      }
      setDailyModal(null);
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleDailyComplete = async (weeklyId: string, d: DailyGoal) => {
    if (!userId) return;
    const next: GoalStatus = d.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDailyGoal(userId, weeklyId, d.id, { status: next });
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const deleteDaily = async (weeklyId: string, d: DailyGoal) => {
    if (!userId) return;
    if (!window.confirm('Delete this daily goal?')) return;
    try {
      await deleteDailyGoal(userId, weeklyId, d.id);
      uniqueToast.success('Deleted');
    } catch (err) {
      uniqueToast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const allTodayDailies = useMemo(() => {
    const out: { weekly: WeeklyGoal; daily: DailyGoal }[] = [];
    weeklyGoals.forEach((w) => {
      const dals = dailyMap[w.id] || [];
      dals.forEach((d) => {
        if (d.date === todayStr) out.push({ weekly: w, daily: d });
      });
    });
    return out;
  }, [weeklyGoals, dailyMap, todayStr]);

  const goalStats = useMemo(() => {
    const total = weeklyGoals.length;
    const completed = weeklyGoals.filter((w) => w.status === 'completed').length;
    const inProgress = weeklyGoals.filter((w) => w.status === 'in_progress').length;
    let overdue = 0;
    weeklyGoals.forEach((w) => {
      if (isOverdueWeekly(w, todayStr)) overdue += 1;
      (dailyMap[w.id] || []).forEach((d) => {
        if (isOverdueDaily(d, todayStr)) overdue += 1;
      });
    });
    return { total, completed, inProgress, overdue };
  }, [weeklyGoals, dailyMap, todayStr]);

  const renderWeeklyCard = (w: WeeklyGoal, dailies: DailyGoal[], opts: { readonly?: boolean }) => {
    const expanded = expandedWeekIds.includes(w.id);
    const sorted = sortDailiesByDate(dailies);
    const pct = computeWeeklyProgress(w, sorted);
    const weekOverdue = isOverdueWeekly(w, todayStr);

    return (
      <WeeklyGoalCard key={w.id} $status={w.status} $overdue={weekOverdue}>
        <Row>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: theme.fontSizes.base, color: theme.colors.textPrimary }}>{w.title}</strong>
            <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary, marginTop: 4 }}>
              {w.weekStart} → {w.weekEnd}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexShrink: 0 }}>
            <PctBadge>{pct}%</PctBadge>
            <Badge $t={w.status}>{GOAL_STATUS_LABEL[w.status]}</Badge>
          </div>
        </Row>
        {w.description ? (
          <p style={{ margin: `${theme.spacing.sm} 0`, fontSize: theme.fontSizes.sm, color: theme.colors.textSecondary }}>
            {w.description}
          </p>
        ) : null}
        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>Progress</div>
        <ProgressTrack>
          <ProgressFill $pct={pct} />
        </ProgressTrack>
        {!opts.readonly && (
          <RowBtns style={{ marginTop: theme.spacing.md }}>
            <Button size="sm" variant="outline" type="button" onClick={() => openDailyModal(w.id)}>
              <Plus size={14} style={{ marginRight: 6 }} aria-hidden strokeWidth={2} />
              Add daily goal
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => toggleExpand(w.id)}>
              {expanded ? (
                <>
                  <ChevronUp size={16} aria-hidden strokeWidth={2} /> Hide daily goals
                </>
              ) : (
                <>
                  <ChevronDown size={16} aria-hidden strokeWidth={2} /> View daily goals
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() =>
                updateWeeklyGoal(userId, w.id, {
                  status: w.status === 'completed' ? 'in_progress' : 'completed',
                }).catch(() => uniqueToast.error('Could not update status'))
              }
            >
              Toggle week done
            </Button>
            <Button size="sm" variant="danger" type="button" onClick={() => handleDeleteWeekly(w.id)}>
              <Trash2 size={14} aria-hidden strokeWidth={2} /> Delete week
            </Button>
          </RowBtns>
        )}
        {expanded && (
          <div style={{ marginTop: theme.spacing.md }}>
            {sorted.length === 0 ? (
              <EmptyHint>No daily goals yet.</EmptyHint>
            ) : (
              sorted.map((d) => (
                <DailyGoalCard key={d.id} $overdue={isOverdueDaily(d, todayStr)}>
                  <Row>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                      {!opts.readonly && (
                        <input
                          type="checkbox"
                          checked={d.status === 'completed'}
                          onChange={() => toggleDailyComplete(w.id, d)}
                          aria-label="Mark daily goal completed"
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: theme.fontWeights.semibold }}>{d.title}</div>
                        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary }}>
                          {d.date} · {GOAL_STATUS_LABEL[d.status]}
                          {isOverdueDaily(d, todayStr) ? ' · Overdue' : ''}
                        </div>
                        {d.description ? (
                          <div style={{ fontSize: theme.fontSizes.sm, marginTop: 4 }}>{d.description}</div>
                        ) : null}
                      </div>
                    </div>
                    {!opts.readonly && (
                      <RowBtns>
                        <Button size="sm" variant="outline" type="button" onClick={() => openDailyModal(w.id, d)}>
                          <Pencil size={14} aria-hidden strokeWidth={2} />
                        </Button>
                        <Button size="sm" variant="outline" type="button" onClick={() => deleteDaily(w.id, d)}>
                          <Trash2 size={14} aria-hidden strokeWidth={2} />
                        </Button>
                      </RowBtns>
                    )}
                  </Row>
                </DailyGoalCard>
              ))
            )}
          </div>
        )}
      </WeeklyGoalCard>
    );
  };

  const renderStaffStudent = (sid: string) => {
    const weeks = staffWeeklies[sid] || [];
    const exp = staffExpanded[sid] || [];
    const name = studentNames[sid] || sid;
    const overall =
      weeks.length === 0
        ? 0
        : Math.round(
            weeks.reduce((acc, w) => {
              const dals = (staffDailyMap[sid] && staffDailyMap[sid][w.id]) || [];
              return acc + computeWeeklyProgress(w, dals);
            }, 0) / weeks.length
          );

    return (
      <StaffStudentCard key={sid}>
        <StaffHeader>
          <StaffName style={{ alignItems: 'flex-start' }}>
            <User size={22} aria-hidden strokeWidth={2} style={{ marginTop: 2 }} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span>
                {name}
                <StaffMeta>
                  {' '}
                  · {weeks.length} week{weeks.length === 1 ? '' : 's'}
                </StaffMeta>
              </span>
              {adminAllHubs && studentHubLabels[sid] ? <HubChip>{studentHubLabels[sid]}</HubChip> : null}
            </span>
          </StaffName>
          <StaffProgressPill>~{overall}% avg</StaffProgressPill>
        </StaffHeader>
        {weeks.length === 0 ? (
          <EmptyHint>No weekly goals yet.</EmptyHint>
        ) : (
          weeks.map((w) => {
            const dailies = (staffDailyMap[sid] && staffDailyMap[sid][w.id]) || [];
            const pct = computeWeeklyProgress(w, dailies);
            const ex = exp.includes(w.id);
            const weekOverdue = isOverdueWeekly(w, todayStr);
            return (
              <WeeklyGoalCard key={w.id} $status={w.status} $overdue={weekOverdue}>
                <Row>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ color: theme.colors.textPrimary }}>{w.title}</strong>
                    <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textSecondary, marginTop: 4 }}>
                      {w.weekStart} → {w.weekEnd}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexShrink: 0 }}>
                    <PctBadge>{pct}%</PctBadge>
                    <Badge $t={w.status}>{GOAL_STATUS_LABEL[w.status]}</Badge>
                  </div>
                </Row>
                <ProgressTrack>
                  <ProgressFill $pct={pct} />
                </ProgressTrack>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  style={{ marginTop: theme.spacing.md }}
                  onClick={() => toggleStaffExpand(sid, w.id)}
                >
                  {ex ? 'Hide' : 'View'} daily goals ({dailies.length})
                </Button>
                {ex && (
                  <div style={{ marginTop: theme.spacing.md }}>
                    {sortDailiesByDate(dailies).map((d) => (
                      <DailyGoalCard key={d.id} $overdue={isOverdueDaily(d, todayStr)}>
                        <div style={{ fontSize: theme.fontSizes.sm }}>
                          <span style={{ fontWeight: theme.fontWeights.semibold }}>{d.title}</span>
                          <span style={{ color: theme.colors.textSecondary }}>
                            {' '}
                            — {d.date} — {GOAL_STATUS_LABEL[d.status]}
                            {isOverdueDaily(d, todayStr) ? ' · Overdue' : ''}
                          </span>
                        </div>
                      </DailyGoalCard>
                    ))}
                  </div>
                )}
              </WeeklyGoalCard>
            );
          })
        )}
      </StaffStudentCard>
    );
  };

  if (!user) {
    return (
      <PageShell>
        <Page>
          <EmptyHint>Sign in to view goals.</EmptyHint>
        </Page>
      </PageShell>
    );
  }

  if (isStaff && !hubScopeId && !adminAllHubs) {
    return (
      <PageShell>
        <Page>
          <Hero>
            <HeroTop>
              <HeroTitleBlock>
                <HeroEyebrow>Goals</HeroEyebrow>
                <H1>Student goals</H1>
                <Sub>
                  {isAdmin
                    ? 'Choose a hub above, or leave “All hubs” to see goals for every student across the organization.'
                    : 'Your instructor hub could not be determined. Check your profile hub assignment, then try again.'}
                </Sub>
              </HeroTitleBlock>
              <LogoWrap>
                <UncommonLogo size="sm" showSubtitle={false} />
              </LogoWrap>
            </HeroTop>
          </Hero>
        </Page>
      </PageShell>
    );
  }

  if (!isStudent && !isStaff) {
    return (
      <PageShell>
        <Page>
          <EmptyHint>Goals are available for students and instructors.</EmptyHint>
        </Page>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Page>
        <Hero>
          <HeroTop>
            <HeroTitleBlock>
              <HeroEyebrow>Goals</HeroEyebrow>
              <H1>
                {staffMode ? (isAdmin ? 'Admin view' : 'Instructor view') : 'My goals'}
              </H1>
              <Sub>
                {staffMode
                  ? isAdmin
                    ? adminAllHubs
                      ? 'Monitor weekly goals for every student across all hubs. Pick a hub to filter the list.'
                      : 'Monitor weekly scrum goals and daily breakdowns for students in the selected hub.'
                    : 'Monitor weekly scrum goals and daily breakdowns for students in your hub.'
                  : 'Set weekly goals and break them into daily tasks. Progress updates in real time.'}
              </Sub>
            </HeroTitleBlock>
            <LogoWrap>
              <UncommonLogo size="sm" showSubtitle={false} />
            </LogoWrap>
          </HeroTop>
        </Hero>

        {!staffMode && (
          <StatGrid>
            <StatCard $accent="primary">
              <StatIcon $accent="primary">
                <Target size={22} strokeWidth={2} aria-hidden />
              </StatIcon>
              <div>
                <StatLabel>Weekly goals</StatLabel>
                <StatValue>{goalStats.total}</StatValue>
              </div>
            </StatCard>
            <StatCard $accent="success">
              <StatIcon $accent="success">
                <CheckCircle size={22} strokeWidth={2} aria-hidden />
              </StatIcon>
              <div>
                <StatLabel>Completed</StatLabel>
                <StatValue>{goalStats.completed}</StatValue>
              </div>
            </StatCard>
            <StatCard $accent="warning">
              <StatIcon $accent="warning">
                <TrendingUp size={22} strokeWidth={2} aria-hidden />
              </StatIcon>
              <div>
                <StatLabel>In progress</StatLabel>
                <StatValue>{goalStats.inProgress}</StatValue>
              </div>
            </StatCard>
            <StatCard $accent="danger">
              <StatIcon $accent="danger">
                <AlertTriangle size={22} strokeWidth={2} aria-hidden />
              </StatIcon>
              <div>
                <StatLabel>Overdue</StatLabel>
                <StatValue>{goalStats.overdue}</StatValue>
              </div>
            </StatCard>
          </StatGrid>
        )}

      {error && (
        <ErrorBanner>
          <AlertCircle size={18} style={{ flexShrink: 0 }} aria-hidden strokeWidth={2} />
          <span>{error}</span>
        </ErrorBanner>
      )}

      {loading && !staffMode && weeklyGoals.length === 0 && !error && (
        <EmptyHint>Loading goals…</EmptyHint>
      )}

      {!staffMode && (
        <>
          {allTodayDailies.length > 0 && (
            <TodayStrip>
              <TodayTitle>
                <CheckSquare size={20} aria-hidden strokeWidth={2} /> Today&apos;s focus
              </TodayTitle>
              {allTodayDailies.map(({ weekly, daily }) => (
                <TodayRow key={`${weekly.id}-${daily.id}`}>
                  <strong style={{ color: theme.colors.textPrimary }}>{daily.title}</strong>{' '}
                  <span style={{ color: theme.colors.textSecondary }}>({weekly.title})</span> — {GOAL_STATUS_LABEL[daily.status]}
                  {isOverdueDaily(daily, todayStr) ? ' · Overdue' : ''}
                </TodayRow>
              ))}
            </TodayStrip>
          )}

          <Card>
            <form onSubmit={handleAddWeekly}>
            <CardTitle>
              <Calendar size={20} aria-hidden strokeWidth={2} /> Add weekly goal
            </CardTitle>
            <FormGrid>
              <Field style={{ gridColumn: '1 / -1' }}>
                <Label>Goal title</Label>
                <Input
                  value={weeklyForm.title}
                  onChange={(e) => setWeeklyForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Finish module 3 assignments"
                  required
                />
              </Field>
              <Field style={{ gridColumn: '1 / -1' }}>
                <Label>Description</Label>
                <TextArea
                  value={weeklyForm.description}
                  onChange={(e) => setWeeklyForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional details"
                />
              </Field>
              <Field>
                <Label>Week start</Label>
                <Input
                  type="date"
                  value={weeklyForm.weekStart}
                  onChange={(e) => setWeeklyForm((p) => ({ ...p, weekStart: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <Label>Week end</Label>
                <Input
                  type="date"
                  value={weeklyForm.weekEnd}
                  onChange={(e) => setWeeklyForm((p) => ({ ...p, weekEnd: e.target.value }))}
                  required
                />
              </Field>
              <Field>
                <Label>Status</Label>
                <Select
                  value={weeklyForm.status}
                  onChange={(e) => setWeeklyForm((p) => ({ ...p, status: e.target.value as GoalStatus }))}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {GOAL_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
            <div style={{ marginTop: theme.spacing.md }}>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Save weekly goal
              </Button>
            </div>
            </form>
          </Card>

          <SectionHeading>
            <CheckCircle size={22} aria-hidden strokeWidth={2} /> Weekly goals
          </SectionHeading>
          {weeklyGoals.length === 0 && !loading ? (
            <EmptyHint>No weekly goals yet. Add one above.</EmptyHint>
          ) : (
            weeklyGoals.map((w) => renderWeeklyCard(w, dailyMap[w.id] || [], { readonly: false }))
          )}
        </>
      )}

      {staffMode && (
        <>
          {loading && studentIds.length === 0 && <EmptyHint>Loading…</EmptyHint>}
          {!loading && studentIds.length === 0 && <EmptyHint>No students found for this hub.</EmptyHint>}
          {studentIds.map((sid) => renderStaffStudent(sid))}
        </>
      )}

      {dailyModal && (
        <Overlay
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDailyModal(null);
          }}
        >
          <ModalPanel role="dialog" aria-modal="true" aria-labelledby="daily-modal-title" onClick={(e) => e.stopPropagation()}>
            <ModalBody>
              <ModalTitle id="daily-modal-title">{dailyModal.edit ? 'Edit daily goal' : 'Add daily goal'}</ModalTitle>
              <form onSubmit={submitDaily}>
                <Field>
                  <Label>Title</Label>
                  <Input
                    value={dailyForm.title}
                    onChange={(e) => setDailyForm((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </Field>
                <Field>
                  <Label>Description</Label>
                  <TextArea
                    value={dailyForm.description}
                    onChange={(e) => setDailyForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </Field>
                <Field>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={dailyForm.date}
                    onChange={(e) => setDailyForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select
                    value={dailyForm.status}
                    onChange={(e) => setDailyForm((p) => ({ ...p, status: e.target.value as GoalStatus }))}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {GOAL_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
                  <Button type="button" variant="outline" onClick={() => setDailyModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                    Save
                  </Button>
                </div>
              </form>
            </ModalBody>
          </ModalPanel>
        </Overlay>
      )}
      </Page>
    </PageShell>
  );
};
