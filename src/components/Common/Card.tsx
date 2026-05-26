import React from 'react';
import { GlassCard } from './GlassCard';

interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, padding = 'md', hover = false, className, style, onClick }) => {
  return (
    <GlassCard
      variant="light"
      padding={padding}
      hover={hover}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </GlassCard>
  );
};
