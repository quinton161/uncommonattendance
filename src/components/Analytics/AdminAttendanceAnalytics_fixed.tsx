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
import { effectiveStaffHubScope } from '../../services/hubService';
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
