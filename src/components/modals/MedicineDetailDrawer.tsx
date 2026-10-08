import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  X,
  Pill,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { formatCurrency, formatShortDate, calculateDaysRemaining } from '../../utils';
import { StockStatusBadge, ExpiryStatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

interface MedicineDetailDrawerProps {
  medicineId: string | null;
  onClose: () => void;
  onEdit: () => void;
}

export const MedicineDetailDrawer: React.FC<MedicineDetailDrawerProps> = ({
  medicineId,
  onClose,
  onEdit
}) => {
  const { medicines, addBatch, deleteBatch, setIsNewSaleOpen } = usePharmacy();

  const [isAddingBatch, setIsAddingBatch] = useState<boolean>(false);
  const [newBatchNumber, setNewBatchNumber] = useState<string>('');
  const [newBatchExpiry, setNewBatchExpiry] = useState<string>('2027-12-31');
  const [newBatchQuantity, setNewBatchQuantity] = useState<number>(50);

  if (!medicineId) return null;

  const medicine = medicines.find(m => m.id === medicineId);
  if (!medicine) return null;

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNumber.trim()) return;

    addBatch(medicine.id, {
      batchNumber: newBatchNumber,
      manufacturingDate: new Date().toISOString().slice(0, 10),
      expiryDate: newBatchExpiry,
      quantity: Number(newBatchQuantity),
      initialQuantity: Number(newBatchQuantity),
      purchasePrice: medicine.unitPrice,
      sellingPrice: medicine.sellingPrice,
      supplierId: medicine.supplierId,
      supplierName: medicine.supplierName,
      receivedDate: new Date().toISOString().slice(0, 10)
    });

    setIsAddingBatch(false);
    setNewBatchNumber('');
    setNewBatchQuantity(50);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{medicine.name}</h2>
                <StockStatusBadge status={medicine.status} />
              </div>
              <p className="text-xs text-slate-500">{medicine.genericName} • {medicine.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onEdit} icon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Stock</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">{medicine.stock} units</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Selling Price</span>
              <span className="text-lg font-bold text-emerald-600 mt-0.5 block">{formatCurrency(medicine.sellingPrice)}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Purchase Cost</span>
              <span className="text-lg font-bold text-slate-700 mt-0.5 block">{formatCurrency(medicine.unitPrice)}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reorder Point</span>
              <span className="text-lg font-bold text-amber-600 mt-0.5 block">{medicine.reorderThreshold} u</span>
            </div>
          </div>

          {/* Stock Level Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-semibold">Inventory Level</span>
              <span>{medicine.stock} / {medicine.maxStock} max capacity</span>
            </div>
            <ProgressBar current={medicine.stock} max={medicine.maxStock} threshold={medicine.reorderThreshold} />
          </div>

          {/* Clinical & Formulation Details */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Specs</h4>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[11px]">Dosage Form</span>
                <span className="font-semibold text-slate-700">{medicine.dosageForm} ({medicine.strength})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Prescription Req.</span>
                <span className="font-semibold text-slate-700">{medicine.prescriptionRequired ? 'Yes (Schedule H)' : 'No (OTC)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Manufacturer</span>
                <span className="font-semibold text-slate-700">{medicine.manufacturer || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Storage Rack</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {medicine.locationRack || 'Aisle 1'}
                </span>
              </div>
            </div>
            {medicine.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                {medicine.description}
              </p>
            )}
          </div>

          {/* Batches Table with Earliest-Expiry Sorting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Batches ({medicine.batches.length})
                </h4>
                <p className="text-[10px] text-slate-400">Dispensed in First-Expiry-First-Out (FEFO) order</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingBatch(!isAddingBatch)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                {isAddingBatch ? 'Cancel' : 'Add Batch'}
              </Button>
            </div>

            {/* Add Batch Form inline */}
            {isAddingBatch && (
              <form onSubmit={handleAddBatch} className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-3 animate-in fade-in">
                <p className="text-xs font-semibold text-blue-900">Record New Received Batch</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">Batch Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-9021"
                      value={newBatchNumber}
                      onChange={e => setNewBatchNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={newBatchExpiry}
                      onChange={e => setNewBatchExpiry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">Units *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newBatchQuantity}
                      onChange={e => setNewBatchQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => setIsAddingBatch(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" type="submit">
                    Save Batch
                  </Button>
                </div>
              </form>
            )}

            {/* Batches List */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {medicine.batches.map(batch => {
                const days = calculateDaysRemaining(batch.expiryDate);

                return (
                  <div key={batch.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Batch {batch.batchNumber}</span>
                        <ExpiryStatusBadge status={batch.status} daysRemaining={days} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Mfg: {formatShortDate(batch.manufacturingDate)} • Exp: {formatShortDate(batch.expiryDate)} • Supplier: {batch.supplierName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">{batch.quantity} units</span>
                        <span className="text-[10px] text-slate-400 block">left of {batch.initialQuantity}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteBatch(medicine.id, batch.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              setIsNewSaleOpen(true);
            }}
          >
            Dispense in POS
          </Button>
        </div>
      </div>
    </div>
  );
};
