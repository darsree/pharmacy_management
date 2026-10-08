import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Batch } from '../types';
import {
  Boxes,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  Truck,
  Calendar,
  Sparkles,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ExpiryStatusBadge, StockStatusBadge } from '../components/common/Badge';
import { formatCurrency, formatShortDate, calculateDaysRemaining } from '../utils';
import { EmptyState } from '../components/common/EmptyState';

export const InventoryPage: React.FC = () => {
  const {
    allBatches,
    medicines,
    updateBatch,
    deleteBatch,
    setIsCreatePOOpen,
    setSelectedMedicineIdForDetails,
    addToast
  } = usePharmacy();

  const [search, setSearch] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'expiring' | 'expired' | 'healthy'>('all');
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  // KPIs
  const totalBatchesCount = allBatches.length;
  const expiredCount = allBatches.filter(b => b.status === 'expired').length;
  const expiring7Count = allBatches.filter(b => b.status === 'expiring_7').length;
  const expiring30Count = allBatches.filter(b => b.status === 'expiring_30').length;
  const expiring60Count = allBatches.filter(b => b.status === 'expiring_60').length;
  const totalExpiringSoon = expiring7Count + expiring30Count + expiring60Count;

  // Filtered & Sorted by Expiry Date ascending (FEFO Order)
  const filteredBatches = useMemo(() => {
    return allBatches
      .filter(batch => {
        const matchesSearch =
          search === '' ||
          batch.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
          batch.medicineName.toLowerCase().includes(search.toLowerCase()) ||
          batch.supplierName.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filterTab === 'expiring') {
          return batch.status === 'expiring_7' || batch.status === 'expiring_30' || batch.status === 'expiring_60';
        }
        if (filterTab === 'expired') {
          return batch.status === 'expired';
        }
        if (filterTab === 'healthy') {
          return batch.status === 'healthy';
        }
        return true;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [allBatches, search, filterTab]);

  const handleSaveQty = (batchId: string) => {
    if (editQty < 0) return;
    updateBatch(batchId, { quantity: editQty });
    setEditingBatch(null);
  };

  const handleApplyDiscount = (batch: Batch) => {
    const discountedPrice = Math.round(batch.sellingPrice * 0.75 * 100) / 100;
    updateBatch(batch.id, { sellingPrice: discountedPrice });
    addToast(
      'success',
      'FEFO Clearance Discount Applied',
      `Applied 25% discount to Batch ${batch.batchNumber} (New Price: ₹${discountedPrice})`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Batch-Level Inventory & Expiry Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated First-Expiry-First-Out (FEFO) dispensing order and expiry risk reduction
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatePOOpen(true)}
            icon={<Truck className="w-3.5 h-3.5" />}
          >
            Order Replenishment
          </Button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterTab('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Tracked Batches</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalBatchesCount}</p>
        </div>

        <div
          onClick={() => setFilterTab('expiring')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'expiring'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700">Expiring Soon (&lt; 60d)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalExpiringSoon}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{expiring7Count} in 7d • {expiring30Count} in 30d</p>
        </div>

        <div
          onClick={() => setFilterTab('expired')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'expired'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700">Expired Batches</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-1">{expiredCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Quarantine / Return</p>
        </div>

        <div
          onClick={() => setFilterTab('healthy')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'healthy'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700">Healthy &gt; 60d</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {allBatches.filter(b => b.status === 'healthy').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Optimal shelf life</p>
        </div>
      </div>

      {/* Expiry Recommendation Alert */}
      {totalExpiringSoon > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed flex-1">
            <strong>FEFO Dispensing Intelligence:</strong> The system automatically selects earliest-expiring batches when building customer sales invoices to prevent stock wastage. Consider offering a 15–25% clearance promotion on batches expiring within 30 days.
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch number, medicine name, distributor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'expiring', 'expired', 'healthy'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterTab === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'expiring' ? 'Expiring Soon' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No Batches Found"
          description="No batches match your active filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">FEFO Order</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Distributor / Received</th>
                  <th className="py-3 px-4">Unit Price (Buy / Sell)</th>
                  <th className="py-3 px-4">Expiry Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((batch, index) => {
                  const days = calculateDaysRemaining(batch.expiryDate);
                  const isEditing = editingBatch?.id === batch.id;

                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedMedicineIdForDetails(batch.medicineId)}
                    >
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          #{index + 1}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                          {batch.batchNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{batch.medicineName}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{formatShortDate(batch.expiryDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={editQty}
                              onChange={e => setEditQty(parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 text-xs border border-blue-400 rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveQty(batch.id)}
                              className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded-md"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{batch.quantity} units</span>
                            <span className="text-[10px] text-slate-400 block">Initial: {batch.initialQuantity}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-medium truncate max-w-[150px]">{batch.supplierName}</p>
                        <p className="text-[10px] text-slate-400">Recv: {formatShortDate(batch.receivedDate)}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{formatCurrency(batch.sellingPrice)}</span>
                        <span className="text-[10px] text-slate-400 block">Cost: {formatCurrency(batch.purchasePrice)}</span>
                      </td>

                      <td className="py-3 px-4">
                        <ExpiryStatusBadge status={batch.status} daysRemaining={days} />
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {days > 0 && days <= 45 && (
                            <button
                              type="button"
                              onClick={() => handleApplyDiscount(batch)}
                              className="px-2 py-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100"
                              title="Apply 25% Clearance Discount"
                            >
                              25% Off
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBatch(batch);
                              setEditQty(batch.quantity);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                            title="Adjust Quantity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBatch(batch.medicineId, batch.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
