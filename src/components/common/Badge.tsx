import React from 'react';
import { StockStatus, BatchExpiryStatus, PriorityLevel } from '../../types';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber' | 'neutral';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    amber: 'bg-orange-50 text-orange-700 border border-orange-200',
    neutral: 'bg-slate-50 text-slate-600 border border-slate-200'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium tracking-wide whitespace-nowrap ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const StockStatusBadge: React.FC<{ status: StockStatus; className?: string }> = ({
  status,
  className = ''
}) => {
  switch (status) {
    case 'in_stock':
      return (
        <Badge variant="success" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          In Stock
        </Badge>
      );
    case 'low_stock':
      return (
        <Badge variant="warning" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Low Stock
        </Badge>
      );
    case 'critical':
      return (
        <Badge variant="amber" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Critical
        </Badge>
      );
    case 'out_of_stock':
      return (
        <Badge variant="danger" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Out of Stock
        </Badge>
      );
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const ExpiryStatusBadge: React.FC<{ status: BatchExpiryStatus; daysRemaining?: number; className?: string }> = ({
  status,
  daysRemaining,
  className = ''
}) => {
  switch (status) {
    case 'expired':
      return (
        <Badge variant="danger" className={className}>
          Expired {daysRemaining !== undefined ? `(${Math.abs(daysRemaining)}d ago)` : ''}
        </Badge>
      );
    case 'expiring_7':
      return (
        <Badge variant="danger" className={className}>
          Expires in {daysRemaining}d
        </Badge>
      );
    case 'expiring_30':
      return (
        <Badge variant="warning" className={className}>
          Expires in {daysRemaining}d
        </Badge>
      );
    case 'expiring_60':
      return (
        <Badge variant="amber" className={className}>
          Expires in {daysRemaining}d
        </Badge>
      );
    case 'healthy':
    default:
      return (
        <Badge variant="success" className={className}>
          Healthy {daysRemaining !== undefined && daysRemaining > 0 ? `(${daysRemaining}d)` : ''}
        </Badge>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel; className?: string }> = ({
  priority,
  className = ''
}) => {
  switch (priority) {
    case 'CRITICAL':
      return <Badge variant="danger" className={className}>CRITICAL</Badge>;
    case 'HIGH':
      return <Badge variant="amber" className={className}>HIGH</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning" className={className}>MEDIUM</Badge>;
    case 'LOW':
    default:
      return <Badge variant="info" className={className}>LOW</Badge>;
  }
};

export const OrderStatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className = ''
}) => {
  switch (status) {
    case 'received':
    case 'completed':
      return (
        <Badge variant="success" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Received
        </Badge>
      );
    case 'ordered':
    case 'pending':
      return (
        <Badge variant="info" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Ordered
        </Badge>
      );
    case 'shipped':
    case 'in_transit':
      return (
        <Badge variant="purple" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Shipped
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="danger" className={className}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Cancelled
        </Badge>
      );
    case 'draft':
    default:
      return (
        <Badge variant="neutral" className={className}>
          Draft
        </Badge>
      );
  }
};

