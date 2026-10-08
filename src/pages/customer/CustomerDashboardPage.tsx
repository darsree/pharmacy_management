import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePharmacy } from '../../context/PharmacyContext';
import { useCustomerData } from '../../context/CustomerDataContext';
import {
  IndianRupee,
  ShoppingBag,
  CalendarDays,
  Receipt,
  FileCheck2,
  MapPin,
  ShieldAlert,
  Pill,
  Store
} from 'lucide-react';
import { KpiCard } from '../../components/common/KpiCard';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatShortDate } from '../../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  picked_up: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200'
};
const STATUS_LABELS: Record<string, string> = {
  delivered: 'Delivered',
  picked_up: 'Picked up',
  processing: 'Processing'
};

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { setActivePage } = usePharmacy();
  const { purchases, stats } = useCustomerData();

  const firstName = (user?.name ?? 'there').split(' ')[0];
  const recent = purchases.slice(0, 4);
  const maxPharmacySpend = Math.max(1, ...stats.spendByPharmacy.map(p => p.value));

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
            My Health & Purchases
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-2">Welcome back, {firstName}</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Your medicine spending, recent orders and favourite pharmacies in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="primary" size="md" onClick={() => setActivePage('pharmacy-finder')} icon={<MapPin className="w-4 h-4" />}>
            Find Pharmacy
          </Button>
          <Button variant="ai" size="md" onClick={() => setActivePage('prescriptions')} icon={<ShieldAlert className="w-4 h-4 text-indigo-200" />}>
            Check Prescription
          </Button>
        </div>
      </div>

      {/* Customer KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={IndianRupee}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
          subtitle={`Across ${stats.ordersCount} orders`}
          onClick={() => setActivePage('purchases')}
        />
        <KpiCard
          label="This Month"
          value={formatCurrency(stats.thisMonthSpent)}
          icon={CalendarDays}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          subtitle="Spent so far this month"
        />
        <KpiCard
          label="Avg. Order Value"
          value={formatCurrency(stats.avgOrderValue)}
          icon={Receipt}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-50"
          subtitle={`${stats.itemsCount} units purchased`}
        />
        <KpiCard
          label="Prescription Orders"
          value={stats.prescriptionOrders}
          icon={FileCheck2}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
          subtitle={`${stats.uniquePharmacies} pharmacies used`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly spend chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly Spending" subtitle="Your medicine spend over the last 6 months" />
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlySpend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [`₹${v}`, 'Spent']} />
                  <Bar dataKey="spent" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spend by pharmacy */}
        <Card>
          <CardHeader title="Where You Buy" subtitle="Spend by pharmacy" />
          <CardContent className="space-y-3">
            {stats.spendByPharmacy.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="font-bold text-slate-900 shrink-0 ml-2">{formatCurrency(p.value, false)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.value / maxPharmacySpend) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top medicines */}
        <Card>
          <CardHeader title="Your Most Bought Medicines" subtitle="By units purchased" />
          <CardContent className="space-y-2.5">
            {stats.topMedicines.map(m => (
              <div key={m.name} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">{m.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-bold text-slate-900">{m.quantity} units</p>
                  <p className="text-[10px] text-slate-500">{formatCurrency(m.spent, false)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader
            title="Recent Orders"
            subtitle="Your latest purchases"
            action={
              <Button size="sm" variant="secondary" onClick={() => setActivePage('purchases')} icon={<ShoppingBag className="w-3.5 h-3.5" />}>
                View all
              </Button>
            }
          />
          <CardContent className="space-y-2.5">
            {recent.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {p.orderNumber} · {p.pharmacyName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatShortDate(p.date)} · {p.items.length} item{p.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900">{formatCurrency(p.total)}</p>
                  <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-semibold border rounded-md ${STATUS_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
