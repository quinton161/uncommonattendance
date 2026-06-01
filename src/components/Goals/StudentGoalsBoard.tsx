import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../Common/Button';
import { theme } from '../../styles/theme';
import { uniqueToast } from '../../utils/toastUtils';
import DataService from '../../services/DataService';
import { effectiveStaffHubScope, initialStaffHubFilter, resolvedHubLabel } from '../../services/hubService';
import { TimeService } from '../../services/timeService';
import { AdminHubScopeSelect } from '../Admin/AdminHubScopeSelect';
import type { DailyGoal, GoalStatus, WeeklyGoal } from '../../types/studentGoals';
import { GOAL_STATUS_LABEL } from '../../types/studentGoals';
import {
  addDailyGoal,
  addWeeklyGoal,
  computeWeeklyProgress,
  DAILY_GOAL_CHECKIN_MIN_TITLE_LEN,
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
  position: relative;
  z-index: 1;
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

const GoalRowContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const GoalTitle = styled.strong`
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textPrimary};
`;

const GoalMeta = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
`;

const GoalDescription = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
`;

const GoalActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-shrink: 0;
`;

const ExpandedDailySection = styled.div`
  margin-top: ${theme.spacing.md};
`;

const DailyDetails = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
`;

const DailyTitle = styled.div`
  font-weight: ${theme.fontWeights.semibold};
`;

const DailyMetaText = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;

const DailyDescription = styled.div`
  font-size: ${theme.fontSizes.sm};
  margin-top: 4px;
`;

const ButtonIconSpacer = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
`;

const StaffNameMeta = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const StaffWeeklyToggle = styled(Button)`
  margin-top: ${theme.spacing.md};
`;

const StaffDailySection = styled.div`
  margin-top: ${theme.spacing.md};
`;

const StaffDailyText = styled.div`
  font-size: ${theme.fontSizes.sm};
`;

const StaffDailyTitle = styled.span`
  font-weight: ${theme.fontWeights.semibold};
`;

const StaffDailyMeta = styled.span`
  color: ${theme.colors.textSecondary};
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

const GoalCalendarCard = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: ${theme.spacing.lg};
  align-items: start;
  margin-bottom: ${theme.spacing.xl};
  padding: ${theme.spacing.md};
  background: linear-gradient(135deg, #e9f6f4 0%, #f5fbff 100%);
  border: 1px solid rgba(0, 82, 204, 0.1);
  border-radius: 28px;
  box-shadow: 0 18px 44px rgba(10, 22, 40, 0.08);
  overflow: hidden;
  position: relative;
  isolation: isolate;

  @media (max-width: ${theme.breakpoints.laptop}) {
    grid-template-columns: 1fr;
  }
`;

const PlannerSidebar = styled.aside`
  display: grid;
  align-content: start;
  gap: ${theme.spacing.sm};
  min-width: 0;
  width: 100%;
  position: relative;
  z-index: 2;
`;

const MiniCalendar = styled.div`
  background: ${theme.colors.white};
  border: 1px solid rgba(0, 82, 204, 0.08);
  border-radius: 18px;
  padding: ${theme.spacing.md};
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

const CalendarTitle = styled.h2`
  margin: 0;
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textPrimary};
`;

const CalendarNav = styled.button`
  width: 30px;
  height: 30px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.gray50};
  color: ${theme.colors.textPrimary};
  border: 1px solid ${theme.colors.gray200};
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const WeekdayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 6px;
`;

const WeekdayLabel = styled.div`
  text-align: center;
  font-size: 10px;
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textLight};
  text-transform: uppercase;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
`;

const CalendarDay = styled.button<{ $selected?: boolean; $muted?: boolean; $today?: boolean }>`
  min-height: 30px;
  border-radius: 10px;
  border: 1px solid ${({ $selected, $today }) => ($selected || $today ? theme.colors.primary : 'transparent')};
  background: ${({ $selected }) => ($selected ? theme.colors.primary : theme.colors.white)};
  color: ${({ $selected, $muted }) => ($selected ? theme.colors.white : $muted ? theme.colors.textLight : theme.colors.textPrimary)};
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};

  &:hover {
    background: ${({ $selected }) => ($selected ? theme.colors.primary : '#f8faff')};
  }
`;

const GoalDotRow = styled.span`
  display: flex;
  gap: 2px;
  min-height: 4px;
`;

const GoalDot = styled.span<{ $status: GoalStatus }>`
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: ${({ $status }) =>
    $status === 'completed' ? theme.colors.success : $status === 'in_progress' ? theme.colors.primary : theme.colors.warning};
`;

const FocusReminderCard = styled.div`
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: ${theme.colors.white};
  border-radius: 18px;
  padding: ${theme.spacing.lg};
`;

const FocusLabel = styled.div`
  font-size: ${theme.fontSizes.xs};
  opacity: 0.82;
  margin-bottom: ${theme.spacing.sm};
`;

const FocusTitle = styled.div`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: 4px;
`;

const FocusMeta = styled.div`
  font-size: ${theme.fontSizes.xs};
  opacity: 0.88;
`;

const FilterCard = styled.div`
  background: ${theme.colors.white};
  border: 1px solid rgba(0, 82, 204, 0.08);
  border-radius: 18px;
  padding: ${theme.spacing.md};
`;

const FilterTitle = styled.div`
  font-family: ${theme.fonts.heading};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.sm};
`;

const FilterItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${({ $active }) => ($active ? theme.colors.textPrimary : theme.colors.textLight)};
  font-size: ${theme.fontSizes.xs};
  padding: 5px 0;
`;

const FilterCheck = styled.span<{ $active?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  border: 1px solid ${({ $active }) => ($active ? theme.colors.primary : theme.colors.gray300)};
  background: ${({ $active }) => ($active ? theme.colors.primary : theme.colors.white)};
`;

const DaySchedulePanel = styled.div`
  background: ${theme.colors.white};
  border: 1px solid rgba(0, 82, 204, 0.08);
  border-radius: 22px;
  padding: ${theme.spacing.md};
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
`;

const ScheduleHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.xs} ${theme.spacing.xs} 0;
`;

const ScheduleTitle = styled.h2`
  margin: 0;
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  color: ${theme.colors.textPrimary};
`;

const ScheduleSub = styled.p`
  margin: 4px 0 0;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
`;

const ViewTabs = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.full};
  padding: 4px;
`;

const ViewTab = styled.span<{ $active?: boolean }>`
  border-radius: ${theme.borderRadius.full};
  padding: 6px 10px;
  font-size: ${theme.fontSizes.xs};
  color: ${({ $active }) => ($active ? theme.colors.textPrimary : theme.colors.textSecondary)};
  background: ${({ $active }) => ($active ? theme.colors.white : 'transparent')};
  font-weight: ${({ $active }) => ($active ? theme.fontWeights.bold : theme.fontWeights.medium)};
`;

const PlannerToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;

const WeekScroller = styled.div`
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 2px;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
`;

const WeekHeaderGrid = styled.div`
  display: grid;
  grid-template-columns: 54px repeat(7, minmax(132px, 1fr));
  gap: 6px;
  min-width: 1000px;
  margin-bottom: ${theme.spacing.sm};
`;

const WeekHeaderSpacer = styled.div`
  color: ${theme.colors.textLight};
  font-size: 10px;
  display: flex;
  align-items: flex-end;
  padding-bottom: ${theme.spacing.sm};
`;

const PlannerDayHeader = styled.button<{ $selected?: boolean; $today?: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(0, 82, 204, 0.18)' : 'transparent')};
  border-radius: 14px;
  background: ${({ $selected, $today }) => ($selected ? 'rgba(0, 82, 204, 0.08)' : $today ? '#eef6ff' : theme.colors.gray50)};
  padding: ${theme.spacing.sm};
  color: ${theme.colors.textPrimary};
  text-align: center;
`;

const PlannerDayName = styled.div`
  font-size: 10px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const PlannerDayNumber = styled.div`
  font-family: ${theme.fonts.heading};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
`;

const PlannerBoardGrid = styled.div`
  display: grid;
  grid-template-columns: 54px repeat(7, minmax(132px, 1fr));
  gap: 6px;
  min-width: 1000px;
`;

const PlannerTimeRail = styled.div`
  display: grid;
  grid-template-rows: repeat(3, 112px);
  gap: 6px;
`;

const PlannerTimeLabel = styled.div`
  color: ${theme.colors.textLight};
  font-size: 10px;
  padding-top: 8px;
  border-top: 1px solid ${theme.colors.gray100};
`;

const PlannerDayColumn = styled.div<{ $selected?: boolean }>`
  min-height: 348px;
  border-radius: 16px;
  background: ${({ $selected }) => ($selected ? '#f3f8ff' : '#fbfcff')};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(0, 82, 204, 0.14)' : theme.colors.gray100)};
  padding: ${theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const ScheduleCheck = styled.input`
  margin-top: 3px;
`;

const PlannerGoalCard = styled.div<{ $status: GoalStatus; $overdue?: boolean }>`
  border-radius: 14px;
  padding: ${theme.spacing.sm};
  background: ${({ $status, $overdue }) =>
    $overdue
      ? '#ffecec'
      : $status === 'completed'
        ? '#eaf7ef'
        : $status === 'in_progress'
          ? '#e7f1ff'
          : '#fff3dc'};
  border: 1px solid
    ${({ $status, $overdue }) =>
      $overdue
        ? 'rgba(231, 76, 60, 0.2)'
        : $status === 'completed'
          ? 'rgba(39, 174, 96, 0.2)'
          : $status === 'in_progress'
            ? 'rgba(0, 82, 204, 0.18)'
            : 'rgba(243, 156, 18, 0.2)'};
`;

const PlannerGoalTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.xs};
`;

const PlannerGoalBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlannerGoalTitle = styled.strong`
  display: block;
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.xs};
  line-height: 1.35;
`;

const PlannerGoalMeta = styled.div`
  margin-top: 4px;
  color: ${theme.colors.textSecondary};
  font-size: 10px;
  line-height: 1.35;
`;

const PlannerGoalActions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: ${theme.spacing.sm};
`;

const MiniAction = styled.button`
  border: 1px solid rgba(0, 82, 204, 0.14);
  background: rgba(255, 255, 255, 0.7);
  color: ${theme.colors.primary};
  border-radius: 8px;
  width: 26px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: ${theme.colors.white};
  }
`;

const PlannerEmptySlot = styled.div`
  border: 1px dashed ${theme.colors.gray200};
  border-radius: 14px;
  min-height: 58px;
  color: ${theme.colors.textLight};
  font-size: ${theme.fontSizes.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${theme.spacing.sm};
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

const StaffNameBlock = styled(StaffName)`
  align-items: flex-start;
`;

const UserIcon = styled(User)`
  margin-top: 2px;
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
  /** When set, staff sees students in this hub. */
  hubScopeId?: string | null;
  /** Staff-wide view: when true with `hubScopeId` unset, load students from every hub. */
  viewAllHubs?: boolean;
}

const STATUS_OPTIONS: GoalStatus[] = ['pending', 'in_progress', 'completed'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PLANNER_TIME_LABELS = ['Focus', 'Next', 'Later'];

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function monthTitle(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function dateLongLabel(iso: string): string {
  return dateFromIso(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function dateShortMonthLabel(iso: string): string {
  return dateFromIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayShortLabel(iso: string): string {
  return dateFromIso(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

function buildWeekDays(iso: string): string[] {
  const selected = dateFromIso(iso);
  const mondayOffset = selected.getDay() === 0 ? -6 : 1 - selected.getDay();
  const monday = new Date(selected);
  monday.setDate(selected.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return dateToIso(d);
  });
}

function buildMonthDays(monthDate: Date): Array<{ iso: string; day: number; inMonth: boolean }> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return {
      iso: dateToIso(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    };
  });
}

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
  const [staffHubFilter, setStaffHubFilter] = useState(() => hubScopeId || initialStaffHubFilter(user));
  const effectiveHubScope = hubScopeId || effectiveStaffHubScope(user ?? null, staffHubFilter);
  const staffAllHubs = Boolean(isStaff && viewAllHubs && !effectiveHubScope);
  const staffMode = isStaff && (Boolean(effectiveHubScope) || staffAllHubs);

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
  const [selectedGoalDate, setSelectedGoalDate] = useState(todayStr);
  const [visibleGoalMonth, setVisibleGoalMonth] = useState(() => dateFromIso(todayStr));

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
        if (staffAllHubs) {
          users = await DataService.getInstance().getUsers(undefined);
        } else if (effectiveHubScope) {
          users = await DataService.getInstance().getUsers(effectiveHubScope);
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
  }, [staffMode, effectiveHubScope, staffAllHubs]);

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
    const title = dailyForm.title.trim();
    if (!title) {
      uniqueToast.error('Title is required');
      return;
    }
    if (
      !staffMode &&
      dailyForm.date === todayStr &&
      title.length < DAILY_GOAL_CHECKIN_MIN_TITLE_LEN
    ) {
      uniqueToast.error(
        `Today's goal needs at least ${DAILY_GOAL_CHECKIN_MIN_TITLE_LEN} characters so check-in can use it.`
      );
      return;
    }
    setSaving(true);
    try {
      if (dailyModal.edit) {
        await updateDailyGoal(userId, dailyModal.weeklyId, dailyModal.edit.id, {
          title,
          description: dailyForm.description,
          date: dailyForm.date,
          status: dailyForm.status,
        });
        uniqueToast.success('Daily goal updated');
      } else {
        await addDailyGoal(userId, dailyModal.weeklyId, {
          title,
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

  const calendarDailies = useMemo(() => {
    const out: { weekly: WeeklyGoal; daily: DailyGoal }[] = [];
    weeklyGoals.forEach((w) => {
      (dailyMap[w.id] || []).forEach((d) => out.push({ weekly: w, daily: d }));
    });
    return out;
  }, [weeklyGoals, dailyMap]);

  const dailyByDate = useMemo(() => {
    return calendarDailies.reduce<Record<string, { weekly: WeeklyGoal; daily: DailyGoal }[]>>(
      (acc, item) => {
        acc[item.daily.date] = [...(acc[item.daily.date] || []), item];
        return acc;
      },
      {}
    );
  }, [calendarDailies]);

  const calendarDays = useMemo(() => buildMonthDays(visibleGoalMonth), [visibleGoalMonth]);
  const selectedDayGoals = dailyByDate[selectedGoalDate] || [];
  const selectedWeekDays = useMemo(() => buildWeekDays(selectedGoalDate), [selectedGoalDate]);

  const shiftGoalMonth = (delta: number) => {
    setVisibleGoalMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

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
          <GoalRowContent>
            <GoalTitle>{w.title}</GoalTitle>
            <GoalMeta>
              {w.weekStart} → {w.weekEnd}
            </GoalMeta>
          </GoalRowContent>
          <GoalActionGroup>
            <PctBadge>{pct}%</PctBadge>
            <Badge $t={w.status}>{GOAL_STATUS_LABEL[w.status]}</Badge>
          </GoalActionGroup>
        </Row>
        {w.description ? (
          <GoalDescription>{w.description}</GoalDescription>
        ) : null}
        <GoalMeta>Progress</GoalMeta>
        <ProgressTrack>
          <ProgressFill $pct={pct} />
        </ProgressTrack>
        {!opts.readonly && (
          <GoalActionGroup>
            <Button size="sm" variant="outline" type="button" onClick={() => openDailyModal(w.id)}>
              <ButtonIconSpacer>
                <Plus size={14} aria-hidden strokeWidth={2} />
              </ButtonIconSpacer>
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
          </GoalActionGroup>
        )}
        {expanded && (
          <ExpandedDailySection>
            {sorted.length === 0 ? (
              <EmptyHint>No daily goals yet.</EmptyHint>
            ) : (
              sorted.map((d) => (
                <DailyGoalCard key={d.id} $overdue={isOverdueDaily(d, todayStr)}>
                  <Row>
                    <DailyDetails>
                      {!opts.readonly && (
                        <input
                          type="checkbox"
                          checked={d.status === 'completed'}
                          onChange={() => toggleDailyComplete(w.id, d)}
                          aria-label="Mark daily goal completed"
                        />
                      )}
                      <div>
                        <DailyTitle>{d.title}</DailyTitle>
                        <DailyMetaText>
                          {d.date} · {GOAL_STATUS_LABEL[d.status]}
                          {isOverdueDaily(d, todayStr) ? ' · Overdue' : ''}
                        </DailyMetaText>
                        {d.description ? <DailyDescription>{d.description}</DailyDescription> : null}
                      </div>
                    </DailyDetails>
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
          </ExpandedDailySection>
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
          <StaffNameBlock>
            <UserIcon size={22} aria-hidden strokeWidth={2} />
            <StaffNameMeta>
              <span>
                {name}
                <StaffMeta>
                  {' '}
                  · {weeks.length} week{weeks.length === 1 ? '' : 's'}
                </StaffMeta>
              </span>
              {staffAllHubs && studentHubLabels[sid] ? <HubChip>{studentHubLabels[sid]}</HubChip> : null}
            </StaffNameMeta>
          </StaffNameBlock>
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
                  <GoalRowContent>
                    <GoalTitle>{w.title}</GoalTitle>
                    <GoalMeta>{w.weekStart} → {w.weekEnd}</GoalMeta>
                  </GoalRowContent>
                  <GoalActionGroup>
                    <PctBadge>{pct}%</PctBadge>
                    <Badge $t={w.status}>{GOAL_STATUS_LABEL[w.status]}</Badge>
                  </GoalActionGroup>
                </Row>
                <ProgressTrack>
                  <ProgressFill $pct={pct} />
                </ProgressTrack>
                <StaffWeeklyToggle
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => toggleStaffExpand(sid, w.id)}
                >
                  {ex ? 'Hide' : 'View'} daily goals ({dailies.length})
                </StaffWeeklyToggle>
                {ex && (
                  <StaffDailySection>
                    {sortDailiesByDate(dailies).map((d) => (
                      <DailyGoalCard key={d.id} $overdue={isOverdueDaily(d, todayStr)}>
                        <StaffDailyText>
                          <StaffDailyTitle>{d.title}</StaffDailyTitle>
                          <StaffDailyMeta>
                            {' '}
                            — {d.date} — {GOAL_STATUS_LABEL[d.status]}
                            {isOverdueDaily(d, todayStr) ? ' · Overdue' : ''}
                          </StaffDailyMeta>
                        </StaffDailyText>
                      </DailyGoalCard>
                    ))}
                  </StaffDailySection>
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

  if (isStaff && !effectiveHubScope && !staffAllHubs) {
    return (
      <PageShell>
        <Page>
          <Hero>
            <HeroTop>
              <HeroTitleBlock>
                <HeroEyebrow>Goals</HeroEyebrow>
                <H1>Student goals</H1>
                <Sub>
                  {isAdmin || user?.userType === 'instructor'
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
                    ? staffAllHubs
                      ? 'Monitor weekly goals for every student across all hubs. Pick a hub to filter the list.'
                      : 'Monitor weekly scrum goals and daily breakdowns for students in the selected hub.'
                    : 'Monitor weekly scrum goals and daily breakdowns for students in your hub.'
                  : 'Set weekly goals and break them into daily tasks. Progress updates in real time.'}
              </Sub>
            </HeroTitleBlock>
            <LogoWrap>
              <UncommonLogo size="sm" showSubtitle={false} />
            </LogoWrap>
            {isStaff && (
              <AdminHubScopeSelect
                user={user}
                value={staffHubFilter}
                onChange={setStaffHubFilter}
                id="goals-page-hub-filter"
              />
            )}
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
          <GoalCalendarCard>
            <PlannerSidebar>
              <MiniCalendar>
                <CalendarHeader>
                  <CalendarNav type="button" aria-label="Previous month" onClick={() => shiftGoalMonth(-1)}>
                    ‹
                  </CalendarNav>
                  <CalendarTitle>{monthTitle(visibleGoalMonth)}</CalendarTitle>
                  <CalendarNav type="button" aria-label="Next month" onClick={() => shiftGoalMonth(1)}>
                    ›
                  </CalendarNav>
                </CalendarHeader>
                <WeekdayGrid>
                  {WEEKDAY_LABELS.map((day, idx) => (
                    <WeekdayLabel key={`${day}-${idx}`}>{day}</WeekdayLabel>
                  ))}
                </WeekdayGrid>
                <CalendarGrid>
                  {calendarDays.map((day) => {
                    const goals = dailyByDate[day.iso] || [];
                    return (
                      <CalendarDay
                        key={day.iso}
                        type="button"
                        $selected={day.iso === selectedGoalDate}
                        $muted={!day.inMonth}
                        $today={day.iso === todayStr}
                        onClick={() => {
                          setSelectedGoalDate(day.iso);
                          setVisibleGoalMonth(dateFromIso(day.iso));
                        }}
                      >
                        <span>{day.day}</span>
                        <GoalDotRow>
                          {goals.slice(0, 3).map(({ daily }) => (
                            <GoalDot key={daily.id} $status={daily.status} />
                          ))}
                        </GoalDotRow>
                      </CalendarDay>
                    );
                  })}
                </CalendarGrid>
              </MiniCalendar>

              <FocusReminderCard>
                <FocusLabel>Today&apos;s focus</FocusLabel>
                <FocusTitle>{allTodayDailies[0]?.daily.title || "Plan today's goals"}</FocusTitle>
                <FocusMeta>
                  {allTodayDailies[0]
                    ? `${allTodayDailies[0].weekly.title} · ${GOAL_STATUS_LABEL[allTodayDailies[0].daily.status]}`
                    : 'Add a daily goal from a weekly goal below.'}
                </FocusMeta>
              </FocusReminderCard>

              <FilterCard>
                <FilterTitle>Filters</FilterTitle>
                <FilterItem $active>
                  <FilterCheck $active /> Daily goals ({calendarDailies.length})
                </FilterItem>
                <FilterItem $active>
                  <FilterCheck $active /> Today ({allTodayDailies.length})
                </FilterItem>
                <FilterItem>
                  <FilterCheck /> Completed ({calendarDailies.filter(({ daily }) => daily.status === 'completed').length})
                </FilterItem>
                <FilterItem>
                  <FilterCheck /> Overdue ({goalStats.overdue})
                </FilterItem>
              </FilterCard>
            </PlannerSidebar>

            <DaySchedulePanel>
              <ScheduleHeader>
                <div>
                  <ScheduleTitle>{dateShortMonthLabel(selectedWeekDays[0])} - {dateShortMonthLabel(selectedWeekDays[6])}</ScheduleTitle>
                  <ScheduleSub>
                    {dateLongLabel(selectedGoalDate)} · {selectedDayGoals.length} selected day goal
                    {selectedDayGoals.length === 1 ? '' : 's'}
                  </ScheduleSub>
                </div>
                <PlannerToolbar>
                  <ViewTabs aria-label="Calendar view">
                    <ViewTab>Daily</ViewTab>
                    <ViewTab $active>Weekly</ViewTab>
                    <ViewTab>Monthly</ViewTab>
                  </ViewTabs>
                  <Button
                    size="sm"
                    variant="primary"
                    type="button"
                    disabled={!weeklyGoals.length}
                    onClick={() => weeklyGoals[0] && openDailyModal(weeklyGoals[0].id)}
                  >
                    <Plus size={14} aria-hidden strokeWidth={2} /> Create Goal
                  </Button>
                </PlannerToolbar>
              </ScheduleHeader>

              <WeekScroller>
                <WeekHeaderGrid>
                  <WeekHeaderSpacer>GMT+2</WeekHeaderSpacer>
                  {selectedWeekDays.map((iso) => (
                    <PlannerDayHeader
                      key={iso}
                      type="button"
                      $selected={iso === selectedGoalDate}
                      $today={iso === todayStr}
                      onClick={() => {
                        setSelectedGoalDate(iso);
                        setVisibleGoalMonth(dateFromIso(iso));
                      }}
                    >
                      <PlannerDayName>{dayShortLabel(iso)}</PlannerDayName>
                      <PlannerDayNumber>{dateFromIso(iso).getDate()}</PlannerDayNumber>
                    </PlannerDayHeader>
                  ))}
                </WeekHeaderGrid>

                <PlannerBoardGrid>
                  <PlannerTimeRail>
                    {PLANNER_TIME_LABELS.map((label) => (
                      <PlannerTimeLabel key={label}>{label}</PlannerTimeLabel>
                    ))}
                  </PlannerTimeRail>

                  {selectedWeekDays.map((iso) => {
                    const goals = dailyByDate[iso] || [];
                    return (
                      <PlannerDayColumn key={iso} $selected={iso === selectedGoalDate}>
                        {goals.length === 0 ? (
                          <PlannerEmptySlot>No goals</PlannerEmptySlot>
                        ) : (
                          goals.map(({ weekly, daily }) => (
                            <PlannerGoalCard
                              key={`${weekly.id}-${daily.id}`}
                              $status={daily.status}
                              $overdue={isOverdueDaily(daily, todayStr)}
                            >
                              <PlannerGoalTop>
                                <ScheduleCheck
                                  type="checkbox"
                                  checked={daily.status === 'completed'}
                                  onChange={() => toggleDailyComplete(weekly.id, daily)}
                                  aria-label="Mark daily goal completed"
                                />
                                <PlannerGoalBody>
                                  <PlannerGoalTitle>{daily.title}</PlannerGoalTitle>
                                  <PlannerGoalMeta>
                                    {weekly.title} · {GOAL_STATUS_LABEL[daily.status]}
                                    {isOverdueDaily(daily, todayStr) ? ' · Overdue' : ''}
                                  </PlannerGoalMeta>
                                </PlannerGoalBody>
                              </PlannerGoalTop>
                              <PlannerGoalActions>
                                <MiniAction type="button" aria-label="Edit daily goal" onClick={() => openDailyModal(weekly.id, daily)}>
                                  <Pencil size={13} aria-hidden strokeWidth={2} />
                                </MiniAction>
                                <MiniAction type="button" aria-label="Delete daily goal" onClick={() => deleteDaily(weekly.id, daily)}>
                                  <Trash2 size={13} aria-hidden strokeWidth={2} />
                                </MiniAction>
                              </PlannerGoalActions>
                            </PlannerGoalCard>
                          ))
                        )}
                      </PlannerDayColumn>
                    );
                  })}
                </PlannerBoardGrid>
              </WeekScroller>
            </DaySchedulePanel>
          </GoalCalendarCard>

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
