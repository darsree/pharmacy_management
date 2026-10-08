import React, { useState } from 'react';
import { usePharmacy, PageRoute } from '../context/PharmacyContext';
import { AIInsight } from '../types';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  Percent,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { PriorityBadge } from '../components/common/Badge';

export const AIInsightsPage: React.FC = () => {
  const { insights, setActivePage, dismissInsight, setIsCreatePOOpen, setPendingReorder, addToast } = usePharmacy();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredInsights = insights.filter(i => {
    if (i.isDismissed) return false;
    if (filterCategory === 'all') return true;
    return i.category === filterCategory;
  });

  const handleAction = (insight: AIInsight) => {
    switch (insight.actionType) {
      case 'reorder':
        // Hand off the SPECIFIC medicine/quantity/supplier this insight is
        // about, so the PO modal pre-fills with that item instead of
        // defaulting to the first low-stock medicine in the catalog.
        if (insight.actionPayload?.medicineId) {
          setPendingReorder({
            medicineId: insight.actionPayload.medicineId,
            quantity: insight.actionPayload.quantity || 50,
            supplierId: insight.actionPayload.supplierId
          });
        }
        setIsCreatePOOpen(true);
        break;
      case 'view_inventory':
        setActivePage('inventory');
        break;
      case 'supplier':
        setActivePage('suppliers');
        break;
      case 'clearance':
        setActivePage('inventory');
        break;
      case 'forecast':
        setActivePage('forecast');
        break;
      case 'review':
      default:
        setActivePage('inventory');
    }
  };

  const criticalCount = insights.filter(i => i.priority === 'CRITICAL' && !i.isDismissed).length;
  const highCount = insights.filter(i => i.priority === 'HIGH' && !i.isDismissed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              MediCore AI Pharmacy Intelligence
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
              Automated Clinical & Supply Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous background evaluation of batch expiry, sales velocity, cross-product demand, and reorder triggers
          </p>
        </div>

        <Button
          variant="ai"
          size="sm"
          onClick={() => addToast('info', 'AI Model Synced', 'Live catalog re-evaluated across 6 clinical and supply chain algorithms.')}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Re-Analyze System Now
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/80 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-950">{criticalCount} Critical Safety & Stock Alerts</p>
            <p className="text-[11px] text-rose-700">Immediate action advised</p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-950">{highCount} Supply Optimization Insights</p>
            <p className="text-[11px] text-indigo-700">Demand surge & substitution opportunities</p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-950">Estimated Margin Lift: +18.4%</p>
            <p className="text-[11px] text-emerald-700">By prioritizing generic substitution</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Insights' },
          { id: 'stockout', label: 'Stockouts & Critical' },
          { id: 'expiry', label: 'Batch Expiries' },
          { id: 'demand', label: 'Demand Surge' },
          { id: 'supplier', label: 'Supplier Restock' },
          { id: 'safety', label: 'Clinical Safety' },
          { id: 'profit', label: 'Profit & Margins' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInsights.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No active alerts for this category</p>
            <p className="text-xs text-slate-500 mt-1">All clinical and inventory parameters are healthy</p>
          </div>
        ) : (
          filteredInsights.map(insight => (
            <div
              key={insight.id}
              className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={insight.priority} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {insight.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {insight.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => dismissInsight(insight.id)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Dismiss
                </button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAction(insight)}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {insight.recommendedAction || 'Take Action'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

