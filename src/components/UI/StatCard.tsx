import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import GlassCard from './GlassCard';

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Label = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.textSecondary};
`;

const Value = styled.div`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.textPrimary};
`;

export const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  return (
    <GlassCard>
      <Row>
        <div>
          <Label>{label}</Label>
          <Value>{value}</Value>
        </div>
      </Row>
    </GlassCard>
  );
};

export default StatCard;
