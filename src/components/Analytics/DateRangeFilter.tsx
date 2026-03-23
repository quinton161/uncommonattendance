import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { DateRange, DateRangePreset } from '../../services/attendanceAnalyticsService';

const Wrap = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-end;
  flex-wrap: wrap;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  box-shadow: ${theme.shadows.sm};
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  min-width: 160px;

  label {
    font-size: ${theme.fontSizes.xs};
    color: ${theme.colors.textSecondary};
    font-weight: ${theme.fontWeights.medium};
  }

  select, input {
    padding: ${theme.spacing.sm};
    border: 1px solid ${theme.colors.gray300};
    border-radius: ${theme.borderRadius.md};
    font-size: ${theme.fontSizes.sm};
    min-height: 40px;

    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 2px ${theme.colors.primary}20;
    }
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    min-width: 100%;
    width: 100%;
  }
`;

export function DateRangeFilter(props: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  presets?: DateRangePreset[];
}): React.ReactElement {
  const presets = props.presets || [
    { label: 'Today', value: 'today' as string },
    { label: 'This Week', value: 'week' as string },
    { label: 'This Month', value: 'month' as string },
    { label: 'Custom', value: 'custom' as string }
  ];

  return (
    <Wrap>
      <Group>
        <label>Range</label>
        <select
          value={typeof props.value.preset === 'string' ? props.value.preset : props.value.preset?.value}
          onChange={(e) => {
            const presetValue = e.target.value;
            const preset = presets.find(p => p.value === presetValue) as DateRangePreset | undefined;
            if (preset) {
              props.onChange({ ...props.value, preset });
            }
          }}
        >
          {presets.map(p => (
            <option key={typeof p === 'string' ? p : p.value} value={typeof p === 'string' ? p : p.value}>
              {typeof p === 'string' ? (p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Custom') : p.label}
            </option>
          ))}
        </select>
      </Group>

      <Group>
        <label>Start</label>
        <input
          type="date"
          value={props.value.startDate}
          onChange={(e) => props.onChange({ ...props.value, startDate: e.target.value })}
          disabled={props.value.preset && props.value.preset.value !== 'custom'}
        />
      </Group>

      <Group>
        <label>End</label>
        <input
          type="date"
          value={props.value.endDate}
          onChange={(e) => props.onChange({ ...props.value, endDate: e.target.value })}
          disabled={props.value.preset && props.value.preset.value !== 'custom'}
        />
      </Group>
    </Wrap>
  );
}

