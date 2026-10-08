import React from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  FileText,
  Download,
  IndianRupee,
  TrendingUp,
  Percent,
  Boxes,
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { sales, medicines, totalRevenue } = usePharmacy();

  // Category revenue split
  const categoryData = [
    { name: 'Antibiotics', value: 18400, color: '#3b82f6' },
    { name: 'Cardiovascular', value: 14200, color: '#10b981' },
    { name: 'Analgesics', value: 9800, color: '#f59e0b' },
    { name: 'Antidiabetic', value: 11500, color: '#8b5cf6' },
    { name: 'Gastrointestinal', value: 6700, color: '#ec4899' }
  ];

  // Top fast-moving medicines
  const topProducts = [
    { name: 'Amoxicillin + Clav 625mg', units: 480, revenue: 57600 },
    { name: 'Paracetamol 650mg (Dolo)', units: 620, revenue: 18600 },
    { name: 'Atorvastatin 20mg', units: 310, revenue: 38750 },
    { name: 'Metformin 500mg SR', units: 420, revenue: 18900 },
    { name: 'Pantoprazole 40mg', units: 350, revenue: 31500 }
  ];

  // Valuation summary
  const totalStockUnits = medicines.reduce((s, m) => s + m.stock, 0);
  const totalCostValuation = medicines.reduce((s, m) => s + m.stock * m.unitPrice, 0);
  const totalRetailValuation = medicines.reduce((s, m) => s + m.stock * m.sellingPrice, 0);
  const projectedGrossProfit = totalRetailValuation - totalCostValuation;

  const handleExportSummary = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Category,Revenue\n' +
      categoryData.map(c => `"${c.name}",${c.value}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pharmacy_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial Analytics & Inventory Valuation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Profit margin analysis, category sales velocity, and balance sheet inventory valuation
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportSummary}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export Financial Report
        </Button>
      </div>

      {/* Valuation Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Inventory Cost Valuation</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{formatCurrency(totalCostValuation)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalStockUnits} total units in stock</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Retail Valuation</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{formatCurrency(totalRetailValuation)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Potential gross revenue</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Projected Gross Margin</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2">{formatCurrency(projectedGrossProfit)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {Math.round((projectedGrossProfit / (totalRetailValuation || 1)) * 100)}% overall margin
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Recorded Gross Sales</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{formatCurrency(totalRevenue || 5400)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across {sales.length} transactions</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Revenue Donut */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader
              title="Sales Distribution by Category"
              subtitle="Therapeutic revenue contribution"
            />
            <CardContent>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`₹${val}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
                {categoryData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate">{item.name}:</span>
                    <strong className="text-slate-900">₹{item.value}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Fast-Moving SKUs */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader
              title="Top 5 Fast-Moving Medicines"
              subtitle="Highest volume dispensing formulations"
            />
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4 text-right">Units Dispensed</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{prod.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {prod.units} units
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(prod.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
