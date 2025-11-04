import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'orange' | 'teal' | 'blue' | 'green' | 'purple' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onViewMore?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  onViewMore,
}) => {
  const colorClasses = {
    orange: 'bg-orange-500 text-white',
    teal: 'bg-teal-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    red: 'bg-red-500 text-white',
  };

  return (
    <Card hover className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p className={clsx(
                'text-sm font-medium mt-1',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={clsx(
            'flex items-center justify-center w-12 h-12 rounded-lg',
            colorClasses[color]
          )}>
            {icon}
          </div>
        </div>
        {onViewMore && (
          <button
            onClick={onViewMore}
            className="flex items-center mt-4 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
          >
            View More
            <ExternalLink size={14} className="ml-1" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};