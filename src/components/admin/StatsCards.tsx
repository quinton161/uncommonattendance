'use client';

import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalStudents: number;
    checkedInToday: number;
    currentlyPresent: number;
    attendanceRate: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'blue',
      description: 'Registered students'
    },
    {
      title: 'Checked In Today',
      value: stats.checkedInToday,
      icon: UserCheck,
      color: 'green',
      description: 'Students who checked in'
    },
    {
      title: 'Currently Present',
      value: stats.currentlyPresent,
      icon: Clock,
      color: 'yellow',
      description: 'Students still on premises'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      color: 'purple',
      description: 'Today\'s attendance rate'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        text: 'text-blue-900'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        text: 'text-green-900'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        text: 'text-yellow-900'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        text: 'text-purple-900'
      }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colorClasses = getColorClasses(card.color);
        
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${colorClasses.text}`}>
                  {card.value}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
