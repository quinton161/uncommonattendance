import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Wrap = styled.div`
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray200};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.lg};
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: ${theme.spacing.md};

  h3 {
    margin: 0;
    font-size: ${theme.fontSizes.lg};
    color: ${theme.colors.textPrimary};
  }

  span {
    color: ${theme.colors.textSecondary};
    font-size: ${theme.fontSizes.xs};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14px, 1fr));
  gap: clamp(4px, 0.7vw, 6px);
`;

const Cell = styled.div<{ $v: number }>`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: ${({ $v }) => {
    // $v: 0..1 where 1 = worst (low attendance)
    const vv = Math.max(0, Math.min(1, $v));
    if (vv < 0.15) return 'rgba(34, 197, 94, 0.20)';   // green-ish
    if (vv < 0.35) return 'rgba(245, 158, 11, 0.22)';  // amber
    if (vv < 0.6) return 'rgba(249, 115, 22, 0.24)';   // orange
    return 'rgba(239, 68, 68, 0.28)';                  // red
  }};
  border: 1px solid rgba(0,0,0,0.06);
  transition: transform 0.15s ease, filter 0.15s ease;
  cursor: default;

  &:hover {
    transform: translateY(-1px);
    filter: saturate(1.15);
  }
`;

export function AttendanceHeatmap(props: {
  title: string;
  subtitle?: string;
  cells: { date: string; value: number; label: string }[];
}): React.ReactElement {
  return (
    <Wrap>
      <TitleRow>
        <h3>{props.title}</h3>
        <span>{props.subtitle || 'Darker = lower attendance'}</span>
      </TitleRow>
      <Grid>
        {props.cells.map((c) => (
          <Cell key={c.date} $v={c.value} title={c.label} />
        ))}
      </Grid>
    </Wrap>
  );
}

