import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  TrendingUp,
  Sparkles,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  ArrowUpRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../utils';
import { predictDemand } from '../services/aiService';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export const DemandForecastPage: React.FC = () => {
  const { medicines, sales, setIsCreatePOOpen, addToast } = usePharmacy();
  const [selectedMedId, setSelectedMedId] = useState<string>(medicines[0]?.id || 'med-1');
  const [forecastDays, setForecastDays] = useState<number>(30);

  // Compute forecasts for all medicines
  const allForecasts = useMemo(() => {
    return medicines.map(m => predictDemand(m.id, forecastDays, medicines, sales));
  }, [medicines, sales, forecastDays]);

  const activeForecast = useMemo(() => {
    return allForecasts.find(f => f.medicineId === selectedMedId) || allForecasts[0];
  }, [allForecasts, selectedMedId]);

  const handleBulkReorder = () => {
    setIsCreatePOOpen(true);
    addToast('info', 'Replenishment Prepared', 'Purchase order opened for AI-recommended replenishment batch sizes.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Demand Forecasting & Predictive Replenishment
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
              Time-Series Trend Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Forecast future consumption using seasonal patterns, historical burn rates, and lead time buffers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            {[7, 30, 60].map(days => (
              <button
                key={days}
                onClick={() => setForecastDays(days)}
                className={`px-3 py-1 rounded-md transition-all ${
                  forecastDays === days
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleBulkReorder}
            icon={<ShoppingCart className="w-4 h-4" />}
          >
            Auto-Generate Reorders
          </Button>
        </div>
      </div>

      {/* Seasonality Insights Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Active Seasonal Factor: High Velocity Inhalers & Antibiotics
            </span>
          </div>
          <h3 className="text-base font-bold">
            Projected Demand Shift for {activeForecast?.medicineName}
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {activeForecast?.aiExplanation}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-3 rounded-xl text-xs space-y-1 shrink-0">
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Confidence Score:</span>
            <strong className="text-emerald-300">{activeForecast?.confidenceScore}%</strong>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Safety Buffer:</span>
            <strong className="text-white">+{activeForecast?.safetyBufferUnits} Units</strong>
          </div>
        </div>
      </div>

      {/* Visual Forecast Chart */}
      {activeForecast && (
        <Card>
          <CardHeader
            title={`${activeForecast.medicineName} – Historical Sales vs Projected Demand (${forecastDays} Days)`}
            subtitle="Comparing recent 14-day historical dispensing velocity against predictive projection"
            action={
              <select
                value={selectedMedId}
                onChange={e => setSelectedMedId(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.stock} in stock)
                  </option>
                ))}
              </select>
            }
          />
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeForecast.chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [val ? `${val} units` : 'N/A']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="historicalSales"
                    name="Historical Sales (Units)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#actualGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="predictedDemand"
                    name="AI Projected Demand (Units)"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#forecastGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast SKU Recommendations Table */}
      <Card>
        <CardHeader
          title="Item-Level Runout Forecast & Restock Schedule"
          subtitle="Estimated depletion timeframe and recommended procurement batch size"
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Medicine Item</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Stockout ETA</th>
                  <th className="py-3 px-4">Predicted {forecastDays}d Demand</th>
                  <th className="py-3 px-4">Suggested Reorder</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allForecasts.map(item => (
                  <tr
                    key={item.medicineId}
                    onClick={() => setSelectedMedId(item.medicineId)}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      selectedMedId === item.medicineId ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.medicineName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <strong>{item.currentStock}</strong> units
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          item.projectedStockDays <= 7
                            ? 'text-rose-600'
                            : item.projectedStockDays <= 15
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.projectedStockDays > 90 ? '>90 Days' : `${item.projectedStockDays} Days`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.predictedDemand} units
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600">
                      {item.recommendedReorder > 0 ? `+${item.recommendedReorder} units` : 'Adequate'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.confidenceScore}%
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.stockoutRisk === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : item.stockoutRisk === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.stockoutRisk}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="py-1 px-2.5 text-[11px]"
                        onClick={() => setIsCreatePOOpen(true)}
                      >
                        Reorder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
