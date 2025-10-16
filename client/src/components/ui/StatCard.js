import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  className,
  loading = false,
  subtitle,
  trend,
  onClick,
  ...props
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  const changeTypeClasses = {
    positive: 'text-green-600 bg-green-100',
    negative: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  };

  const getTrendIcon = () => {
    if (changeType === 'positive') return <TrendingUp className="w-3 h-3" />;
    if (changeType === 'negative') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-gray-300",
        onClick && "cursor-pointer hover:bg-gray-50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {trend && (
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                changeTypeClasses[changeType]
              )}>
                {getTrendIcon()}
                <span>{trend}</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </>
          )}
          
          {change && !trend && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  "inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                  changeTypeClasses[changeType]
                )}
              >
                {getTrendIcon()}
                <span>{change}</span>
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "flex-shrink-0 p-3 rounded-xl transition-colors duration-200", 
            colorClasses[color]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export const StatCardGrid = ({ children, className }) => (
  <div className={cn(
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
    className
  )}>
    {children}
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-4 bg-gray-100 rounded w-16"></div>
    </div>
  </div>
);
