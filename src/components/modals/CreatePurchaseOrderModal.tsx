import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Plus, Trash2, ShoppingCart, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose
}) => {
  const { suppliers, medicines, createPurchaseOrder, lowStockMedicinesCount, pendingReorder, setPendingReorder } = usePharmacy();

  const [supplierId, setSupplierId] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [items, setItems] = useState<Array<{ medicineId: string; quantity: number; purchasePrice: number }>>([]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    // Default expected delivery date: 5 days from now
    const d = new Date();
    d.setDate(d.getDate() + 5);
    setExpectedDeliveryDate(d.toISOString().slice(0, 10));

    if (pendingReorder) {
      // Came from an AI Insight's "Reorder" button — prefill with THAT
      // specific medicine, not whatever the generic default would pick.
      const med = medicines.find(m => m.id === pendingReorder.medicineId);
      if (med) {
        setItems([{ medicineId: med.id, quantity: pendingReorder.quantity, purchasePrice: med.unitPrice }]);
        setSupplierId(pendingReorder.supplierId || med.supplierId || (suppliers[0]?.id ?? ''));
      }
      setPendingReorder(null); // consume it so a later manual open doesn't reuse stale data
      return;
    }

    // Plain manual open (no insight payload): only seed a default row the
    // first time, so we don't clobber what the person is actively editing.
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
    if (medicines.length > 0 && items.length === 0) {
      const firstLow = medicines.find(m => m.status === 'low_stock' || m.status === 'critical') || medicines[0];
      setItems([{ medicineId: firstLow.id, quantity: 100, purchasePrice: firstLow.unitPrice }]);
    }
  }, [isOpen]);

  const addItemRow = () => {
    if (!medicines.length) return;
    setItems(prev => [
      ...prev,
      { medicineId: medicines[0].id, quantity: 50, purchasePrice: medicines[0].unitPrice }
    ]);
  };

  const updateItemRow = (
    index: number,
    field: 'medicineId' | 'quantity' | 'purchasePrice',
    value: string | number
  ) => {
    setItems(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === 'medicineId') {
          const med = medicines.find(m => m.id === value);
          return {
            ...item,
            medicineId: String(value),
            purchasePrice: med ? med.unitPrice : item.purchasePrice
          };
        }
        return {
          ...item,
          [field]: Number(value)
        };
      })
    );
  };

  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const autoAddLowStock = () => {
    const lowStockItems = medicines.filter(m => m.status === 'low_stock' || m.status === 'critical' || m.status === 'out_of_stock');
    if (!lowStockItems.length) return;

    const newRows = lowStockItems.map(m => ({
      medicineId: m.id,
      quantity: Math.max(50, m.reorderThreshold * 2 - m.stock),
      purchasePrice: m.unitPrice
    }));
    setItems(newRows);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length || !supplierId) return;

    createPurchaseOrder({
      supplierId,
      items,
      expectedDeliveryDate,
      notes
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order (PO)"
      subtitle="Procure medicines from registered pharmaceutical distributors"
      maxWidth="3xl"
      footer={
        <>
          <div className="mr-auto text-xs text-slate-500">
            Estimated Total: <strong className="text-slate-900">{formatCurrency(grandTotal)}</strong>
          </div>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!items.length}
            onClick={handleSubmit}
            icon={<ShoppingCart className="w-4 h-4" />}
          >
            Submit Purchase Order
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.paymentTerms})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Delivery Date *
            </label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={e => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* Low Stock Quick Add Bar */}
        {lowStockMedicinesCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="text-xs text-amber-800">
              <strong>{lowStockMedicinesCount} medicines</strong> are currently below reorder threshold.
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={autoAddLowStock}
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
            >
              Auto-Fill Low Stock
            </Button>
          </div>
        )}

        {/* Order Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700">Order Items ({items.length})</h4>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={addItemRow}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {items.map((item, idx) => {
              const med = medicines.find(m => m.id === item.medicineId);

              return (
                <div key={idx} className="p-3 bg-white flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={item.medicineId}
                      onChange={e => updateItemRow(idx, 'medicineId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden"
                    >
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.genericName}) - Stock: {m.stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] text-slate-400">Order Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] text-slate-400">Unit Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.purchasePrice}
                      onChange={e => updateItemRow(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="w-24 text-right">
                    <p className="text-[10px] text-slate-400">Line Total</p>
                    <p className="text-xs font-bold text-slate-800">
                      {formatCurrency(item.quantity * item.purchasePrice)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-slate-300 hover:text-rose-600 disabled:opacity-30 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* PO Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Supplier Delivery Notes / Instructions
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Please deliver between 9 AM - 2 PM, include test certificates..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>
      </form>
    </Modal>
  );
};
