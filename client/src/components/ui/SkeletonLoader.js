import React from 'react';

const SkeletonLoader = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  variant = 'default',
  count = 1 
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded';
  
  const variants = {
    default: 'bg-gray-200',
    card: 'bg-gray-100 rounded-lg',
    text: 'bg-gray-200 rounded',
    avatar: 'bg-gray-200 rounded-full',
    button: 'bg-gray-200 rounded-md'
  };

  const skeletonClass = `${baseClasses} ${variants[variant]} ${width} ${height} ${className}`;

  if (count === 1) {
    return <div className={skeletonClass} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} />
      ))}
    </div>
  );
};

export const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <SkeletonLoader variant="avatar" width="w-12" height="h-12" />
        <div className="flex-1">
          <SkeletonLoader width="w-3/4" height="h-4" className="mb-2" />
          <SkeletonLoader width="w-1/2" height="h-3" />
        </div>
      </div>
      <SkeletonLoader count={3} className="mb-2" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <SkeletonLoader width="w-48" height="h-6" />
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <SkeletonLoader 
                width={colIndex === 0 ? "w-full" : "w-3/4"} 
                height="h-4" 
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="animate-pulse">
      <div className="flex items-center">
        <SkeletonLoader variant="avatar" width="w-12" height="h-12" className="mr-4" />
        <div className="flex-1">
          <SkeletonLoader width="w-24" height="h-4" className="mb-2" />
          <SkeletonLoader width="w-16" height="h-8" />
        </div>
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonLoader width="w-64" height="h-8" className="mb-2" />
              <SkeletonLoader width="w-48" height="h-4" />
            </div>
            <SkeletonLoader variant="button" width="w-32" height="h-10" />
          </div>
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardSkeleton className="h-96" />
        <CardSkeleton className="h-96" />
      </div>
    </main>
  </div>
);

export default SkeletonLoader;
