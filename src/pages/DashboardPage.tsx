import React from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  Pill,
  AlertTriangle,
  Clock,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Boxes,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { KpiCard } from '../components/common/KpiCard';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StockStatusBadge, ExpiryStatusBadge, PriorityBadge } from '../components/common/Badge';
import { formatCurrency, formatShortDate, calculateDaysRemaining } from '../utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isPharmacist = user?.role === 'pharmacist';
  const {
    todaySalesRevenue,
    totalRevenue,
    totalMedicinesCount,
    lowStockMedicinesCount,
    expiringSoonBatchesCount,
    outOfStockMedicinesCount,
    pendingPurchaseOrdersCount,
    insights,
    sales,
    allBatches,
    medicines,
    setActivePage,
    setIsNewSaleOpen,
    setIsAddMedicineOpen,
    setIsCreatePOOpen,
    setSelectedMedicineIdForDetails
  } = usePharmacy();

  // Stock Breakdown for Donut Chart
  const stockBreakdown = [
    { name: 'In Stock', value: medicines.filter(m => m.status === 'in_stock').length, color: '#10b981' },
    { name: 'Low Stock', value: medicines.filter(m => m.status === 'low_stock').length, color: '#f59e0b' },
    { name: 'Critical', value: medicines.filter(m => m.status === 'critical').length, color: '#f97316' },
    { name: 'Out of Stock', value: medicines.filter(m => m.status === 'out_of_stock').length, color: '#ef4444' }
  ];

  // 7-day Sales Trend Data
  const recentDaysSalesData = [
    { day: 'Mon', revenue: 4200, orders: 12 },
    { day: 'Tue', revenue: 5800, orders: 18 },
    { day: 'Wed', revenue: 6100, orders: 19 },
    { day: 'Thu', revenue: 4900, orders: 15 },
    { day: 'Fri', revenue: 7300, orders: 24 },
    { day: 'Sat', revenue: 8900, orders: 31 },
    { day: 'Today', revenue: todaySalesRevenue || 5400, orders: 17 }
  ];

  // Urgent batches nearing expiry (< 60 days)
  const urgentBatches = allBatches
    .filter(b => b.quantity > 0 && (b.status === 'expiring_7' || b.status === 'expiring_30' || b.status === 'expiring_60'))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 4);

  // Critical stock medicines
  const lowStockList = medicines
    .filter(m => m.status === 'low_stock' || m.status === 'critical' || m.status === 'out_of_stock')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Ribbon */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
              Live Pharmacy Operations
            </span>
            <span className="text-xs text-slate-300">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            MediCore Smart Pharmacy Dashboard
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Batch-level expiry tracking, real-time FEFO dispensing, prescription interaction safety, and AI demand forecasting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isPharmacist && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewSaleOpen(true)}
            icon={<Receipt className="w-4 h-4" />}
          >
            New Sale (POS)
          </Button>
          )}
          <Button
            variant="ai"
            size="md"
            onClick={() => setActivePage('prescriptions')}
            icon={<ShieldAlert className="w-4 h-4 text-indigo-200" />}
          >
            Check Prescription
          </Button>
          {isPharmacist && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCreatePOOpen(true)}
            className="text-slate-800 bg-white hover:bg-slate-100"
            icon={<ShoppingCart className="w-4 h-4 text-slate-600" />}
          >
            Create PO
          </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Today's Revenue"
          value={formatCurrency(todaySalesRevenue || 5400)}
          icon={IndianRupee}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
          trend={{ value: '+14.2% vs avg', isPositive: true }}
          subtitle="From 17 transactions"
        />

        <KpiCard
          label="Total Catalog"
          value={totalMedicinesCount}
          icon={Pill}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          subtitle={`${allBatches.length} active batches`}
          onClick={() => setActivePage('medicines')}
        />

        <KpiCard
          label="Low Stock Alerts"
          value={lowStockMedicinesCount}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
          trend={{ value: `${lowStockMedicinesCount} items`, isPositive: false }}
          subtitle="Below safe reorder pt."
          onClick={() => setActivePage('inventory')}
        />

        <KpiCard
          label="Expiring Soon"
          value={expiringSoonBatchesCount}
          icon={Clock}
          iconColor="text-rose-600"
          iconBgColor="bg-rose-50"
          trend={{ value: '< 60 Days', isPositive: false }}
          subtitle="Needs early dispensing"
          onClick={() => setActivePage('inventory')}
        />

        <KpiCard
          label="Out of Stock"
          value={outOfStockMedicinesCount}
          icon={Boxes}
          iconColor="text-slate-600"
          iconBgColor="bg-slate-100"
          subtitle="Urgent PO required"
          onClick={() => setActivePage('inventory')}
        />

        <KpiCard
          label="Open PO Orders"
          value={pendingPurchaseOrdersCount}
          icon={ShoppingCart}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-50"
          subtitle="Awaiting delivery"
          onClick={() => setActivePage('purchases')}
        />
      </div>

      {/* AI Decision & Optimization Banner */}
      {insights.length > 0 && (
        <div className="p-4.5 bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-200/80 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  MediCore AI Clinical & Inventory Recommendations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Automated intelligence for stock optimization, expiry risk mitigation, and margin maximization
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePage('ai-insights')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
            >
              View All Insights ({insights.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.slice(0, 3).map(insight => (
              <div
                key={insight.id}
                className="p-3.5 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <PriorityBadge priority={insight.priority} />
                    <span className="text-[10px] text-slate-400 capitalize">{insight.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{insight.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{insight.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-indigo-700">
                    {insight.recommendedAction}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] py-1 px-2.5"
                    onClick={() => setActivePage(insight.actionType === 'forecast' ? 'forecast' : insight.actionType === 'clearance' || insight.actionType === 'view_inventory' ? 'inventory' : insight.actionType === 'reorder' ? 'purchases' : 'ai-insights')}
                  >
                    Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Revenue & Sales Velocity */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader
              title="Sales Revenue & Order Velocity (7-Day Overview)"
              subtitle="Daily dispensing total and volume trend"
              action={
                <Button size="sm" variant="ghost" onClick={() => setActivePage('reports')}>
                  Full Analytics →
                </Button>
              }
            />
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentDaysSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => [`₹${val}`, 'Revenue']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices Table */}
          <Card>
            <CardHeader
              title="Recent Invoices & Dispensing History"
              subtitle="Live Point of Sale transaction records"
              action={
                <Button size="sm" variant="outline" onClick={() => setActivePage('sales')}>
                  View All ({sales.length})
                </Button>
              }
            />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items Count</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.slice(0, 5).map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-blue-600">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{sale.customerName}</p>
                          <p className="text-[10px] text-slate-400">{formatShortDate(sale.date)}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {sale.items.length} items ({sale.items.reduce((s, i) => s + i.quantity, 0)} units)
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(sale.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 4 cols: Inventory Health & Expiry Watchlist */}
        <div className="lg:col-span-4 space-y-6">
          {/* Stock Health Donut */}
          <Card>
            <CardHeader
              title="Stock Health Breakdown"
              subtitle="Catalog inventory status distribution"
            />
            <CardContent>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stockBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
                {stockBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}:</span>
                    <strong className="text-slate-900">{item.value}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Near-Expiry Batches Watchlist */}
          <Card>
            <CardHeader
              title="Batch Expiry Watchlist"
              subtitle="Batches requiring priority FEFO dispensing"
              action={
                <button
                  onClick={() => setActivePage('inventory')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  All Batches
                </button>
              }
            />
            <CardContent className="space-y-3">
              {urgentBatches.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No batches near expiry (&lt; 60 days).
                </div>
              ) : (
                urgentBatches.map(batch => {
                  const days = calculateDaysRemaining(batch.expiryDate);
                  return (
                    <div
                      key={batch.id}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{batch.medicineName}</p>
                        <p className="text-[10px] text-slate-500">
                          Batch: {batch.batchNumber} • Qty: <strong>{batch.quantity} units</strong>
                        </p>
                      </div>
                      <ExpiryStatusBadge status={batch.status} daysRemaining={days} />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items Watchlist */}
          <Card>
            <CardHeader
              title="Low Stock Reorder List"
              subtitle="Medicines below safe inventory threshold"
              action={
                isPharmacist ? (
                  <Button size="sm" variant="outline" onClick={() => setIsCreatePOOpen(true)}>
                    Restock All
                  </Button>
                ) : undefined
              }
            />
            <CardContent className="space-y-3">
              {lowStockList.length === 0 ? (
                <div className="p-4 text-center text-xs text-emerald-600 bg-emerald-50 rounded-xl">
                  All catalog items meet safety stock thresholds.
                </div>
              ) : (
                lowStockList.map(med => (
                  <div
                    key={med.id}
                    onClick={() => setSelectedMedicineIdForDetails(med.id)}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{med.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Stock: <span className="font-bold text-rose-600">{med.stock}</span> / Threshold: {med.reorderThreshold}
                      </p>
                    </div>
                    <StockStatusBadge status={med.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
