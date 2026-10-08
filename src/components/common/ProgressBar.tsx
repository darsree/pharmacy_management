import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  threshold?: number;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  threshold,
  showLabel = false,
  className = '',
  size = 'md'
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((current / (max || 1)) * 100)));

  let colorClass = 'bg-emerald-500';
  if (current <= 0) {
    colorClass = 'bg-rose-500';
  } else if (threshold && current < threshold * 0.4) {
    colorClass = 'bg-orange-500';
  } else if (threshold && current <= threshold) {
    colorClass = 'bg-amber-500';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
          <span>{current} / {max} units</span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
