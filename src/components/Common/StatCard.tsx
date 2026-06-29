import React from 'react';
import { Card, CardContent } from '../UI/card';

interface StatCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  animationDelay?: number;
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
};

const colorIconMap: Record<string, string> = {
  blue: 'bg-[#0052CC]',
  green: 'bg-[#10B981]',
  orange: 'bg-[#F59E0B]',
  red: 'bg-[#EF4444]',
  purple: 'bg-[#8B5CF6]',
};

const trendStyles: Record<string, string> = {
  up: 'bg-green-100 text-green-700',
  down: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  sub,
  variant = 'default',
  color,
  trend,
  className,
}) => {
  const isGradient = variant !== 'default';

  return (
    <Card
      className={`
        ${isGradient ? 'text-white border-0' : ''}
        ${variant === 'primary' ? 'bg-gradient-to-br from-[#0052CC] to-[#003D99]' : ''}
        ${variant === 'accent' ? 'bg-gradient-to-br from-[#F59E0B] to-[#e67e22]' : ''}
        ${variant === 'success' ? 'bg-gradient-to-br from-[#10B981] to-[#1e8449]' : ''}
        ${variant === 'warning' ? 'bg-gradient-to-br from-[#F59E0B] to-[#d68910]' : ''}
        transition-all duration-200 hover:border-[rgba(0,82,204,0.14)]
        ${className ?? ''}
      `}
    >
      <CardContent className="p-4 sm:p-6">
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white mb-3 ${
              color ? colorIconMap[color] : isGradient ? 'bg-white/20' : 'bg-[#0052CC]'
            }`}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-5 h-5',
            })}
          </div>
        )}
        <div className={`text-3xl font-bold leading-tight font-['Chillax'] mb-0.5 ${color && !isGradient ? `text-${colorMap[color]?.split(' ')[1]}` : ''}`}>
          {value}
        </div>
        <div className="text-sm uppercase tracking-wider opacity-90 font-medium">
          {label}
        </div>
        {sub && (
          <div className="text-sm text-muted-foreground mt-1">
            {sub}
          </div>
        )}
        {trend && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-2 ${
              trendStyles[trend.direction] || trendStyles.neutral
            }`}
          >
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
