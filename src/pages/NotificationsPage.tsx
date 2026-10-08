import React from 'react';
import { usePharmacy, PageRoute } from '../context/PharmacyContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatShortDate } from '../utils';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, setActivePage } = usePharmacy();

  const handleAction = (notif: any) => {
    markNotificationRead(notif.id);
    if (notif.linkRoute) {
      setActivePage(notif.linkRoute as PageRoute);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            System Alerts & Operational Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time batch expiry warnings, safety contraindications, and low inventory replenishment triggers
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50 border-dashed">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">All Clear! No Active Alerts</h3>
          <p className="text-xs text-slate-500 mt-1">
            Your inventory, batch expiries, and purchase orders are in good operational standing.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleAction(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !notif.read
                  ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'expiry'
                      ? 'bg-rose-100 text-rose-600'
                      : notif.type === 'low_stock' || notif.type === 'critical_stock'
                      ? 'bg-amber-100 text-amber-600'
                      : notif.type === 'prescription'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {notif.type === 'expiry' ? (
                    <Clock className="w-4 h-4" />
                  ) : notif.type === 'low_stock' || notif.type === 'critical_stock' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : notif.type === 'prescription' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {formatShortDate(notif.timestamp)}
                  </span>
                </div>
              </div>

              {notif.linkRoute && (
                <div className="shrink-0">
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
