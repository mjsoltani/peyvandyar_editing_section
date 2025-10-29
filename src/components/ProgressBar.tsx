'use client';

import { useTranslations } from 'next-intl';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

export default function ProgressBar({
  current,
  total,
  label,
  showPercentage = true,
  showNumbers = true,
  size = 'md',
  color = 'blue'
}: ProgressBarProps) {
  const t = useTranslations('common');
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className="w-full">
      {(label || showNumbers || showPercentage) && (
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-gray-700">{label}</span>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {showNumbers && (
              <span className="text-gray-600">
                {current} / {total}
              </span>
            )}
            {showPercentage && (
              <span className="text-gray-600 font-medium">
                {percentage}%
              </span>
            )}
          </div>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function CircularProgress({ 
  percentage, 
  size = 60, 
  strokeWidth = 4,
  color = 'blue' 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-blue-600',
    green: 'stroke-green-600',
    red: 'stroke-red-600',
    yellow: 'stroke-yellow-600'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-out ${colorClasses[color]}`}
        />
      </svg>
      <span className="absolute text-sm font-medium text-gray-700">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}