import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
  trend,
  subtitle,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight truncate">
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
          {trend ? (
            <div
              className={`flex items-center gap-1 font-medium ${
                trend.isNeutral
                  ? 'text-slate-500'
                  : trend.isPositive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {trend.isNeutral ? (
                <Minus className="w-3.5 h-3.5" />
              ) : trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
            </div>
          ) : (
            <span />
          )}

          {subtitle && <span className="text-slate-500 truncate text-[11px]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
