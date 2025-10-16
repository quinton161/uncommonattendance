import React from 'react';
import { cn } from '../../lib/utils';

export default function Progress({
  value = 0,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  animated = false,
  striped = false,
  className,
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[color],
            animated && "animate-pulse",
            striped && "bg-gradient-to-r from-transparent via-white to-transparent bg-[length:20px_20px] animate-[stripe_1s_linear_infinite]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function CircularProgress({
  value = 0,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = true,
  strokeWidth = 4,
  className,
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const sizes = {
    sm: 48,
    md: 64,
    lg: 80,
    xl: 96
  };

  const radius = (sizes[size] - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-blue-600',
    green: 'stroke-green-600',
    red: 'stroke-red-600',
    yellow: 'stroke-yellow-600',
    purple: 'stroke-purple-600',
    gray: 'stroke-gray-600'
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", sizeClasses[size], className)} {...props}>
      <svg
        className="transform -rotate-90"
        width={sizes[size]}
        height={sizes[size]}
      >
        {/* Background circle */}
        <circle
          cx={sizes[size] / 2}
          cy={sizes[size] / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={sizes[size] / 2}
          cy={sizes[size] / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", colorClasses[color])}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
