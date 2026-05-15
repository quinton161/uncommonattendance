import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  className?: string;
}

const RingContainer = styled.div<{ $size: number }>`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SVGWrapper = styled.svg`
  transform: rotate(-90deg);
  position: absolute;
  top: 0;
  left: 0;
`;

const BackgroundCircle = styled.circle<{ $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
`;

const ProgressCircle = styled.circle<{ $color: string; $dasharray: number; $dashoffset: number }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-linecap: round;
  stroke-dasharray: ${({ $dasharray }) => $dasharray};
  stroke-dashoffset: ${({ $dashoffset }) => $dashoffset};
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

const CenterContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = theme.colors.primary,
  backgroundColor = 'rgba(0, 82, 204, 0.1)',
  children,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (progress / 100) * circumference;

  return (
    <RingContainer $size={size} className={className}>
      <SVGWrapper width={size} height={size}>
        <BackgroundCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          $color={backgroundColor}
        />
        <ProgressCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          $color={color}
          $dasharray={circumference}
          $dashoffset={dashoffset}
        />
      </SVGWrapper>
      <CenterContent>{children}</CenterContent>
    </RingContainer>
  );
};

export default ProgressRing;
