import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useCustomerData } from '../../context/CustomerDataContext';
import { CUSTOMER_PHARMACIES, CustomerPurchase } from '../../data/customerMockData';
import { Plus, Search, Trash2, Store, FileCheck2, X } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatCurrency, formatShortDate } from '../../utils';

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

interface DraftItem {
  medicineName: string;
  quantity: string;
  unitPrice: string;
}

const emptyItem = (): DraftItem => ({ medicineName: '', quantity: '1', unitPrice: '' });
const today = () => new Date().toISOString().slice(0, 10);

export const CustomerPurchasesPage: React.FC = () => {
  const { addToast } = usePharmacy();
  const { purchases, stats, addPurchase, deletePurchase } = useCustomerData();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add-purchase form state
  const [pharmacyName, setPharmacyName] = useState(CUSTOMER_PHARMACIES[0]);
  const [date, setDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState<CustomerPurchase['paymentMethod']>('UPI');
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  const q = search.trim().toLowerCase();
  const filtered = purchases.filter(
    p =>
      !q ||
      p.orderNumber.toLowerCase().includes(q) ||
      p.pharmacyName.toLowerCase().includes(q) ||
      p.items.some(i => i.medicineName.toLowerCase().includes(q))
  );

  const draftTotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  const resetForm = () => {
    setPharmacyName(CUSTOMER_PHARMACIES[0]);
    setDate(today());
    setPaymentMethod('UPI');
    setPrescriptionVerified(false);
    setNotes('');
    setItems([emptyItem()]);
  };

  const updateItem = (idx: number, field: keyof DraftItem, value: string) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const handleSave = () => {
    const cleaned = items
      .map(i => ({
        medicineName: i.medicineName.trim(),
        quantity: Math.floor(Number(i.quantity)),
        unitPrice: Number(i.unitPrice)
      }))
      .filter(i => i.medicineName);

    if (cleaned.length === 0) {
      addToast('error', 'Add a medicine', 'Enter at least one medicine name.');
      return;
    }
    if (cleaned.some(i => !(i.quantity > 0) || !(i.unitPrice >= 0) || Number.isNaN(i.unitPrice))) {
      addToast('error', 'Check quantities and prices', 'Quantity must be 1 or more and price must be a valid number.');
      return;
    }

    addPurchase({ pharmacyName, date, paymentMethod, items: cleaned, prescriptionVerified, notes: notes.trim() || undefined });
    addToast('success', 'Purchase added', `Recorded ${cleaned.length} item(s) from ${pharmacyName}.`);
    setIsAddOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Purchases</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.ordersCount} orders · {formatCurrency(stats.totalSpent)} spent in total
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Purchase
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order number, pharmacy or medicine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-xs text-slate-500">No purchases match your search.</Card>
        )}
        {filtered.map(p => (
          <Card key={p.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-blue-600">{p.orderNumber}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-md ${STATUS_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  {p.prescriptionVerified && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md inline-flex items-center gap-1">
                      <FileCheck2 className="w-3 h-3" /> Prescription verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  {p.pharmacyName} · {formatShortDate(p.date)} · {p.paymentMethod}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-slate-900">{formatCurrency(p.total)}</span>
                <button
                  type="button"
                  onClick={() => deletePurchase(p.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-md hover:bg-slate-100"
                  title="Remove purchase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {p.items.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs bg-slate-50/60">
                  <span className="font-semibold text-slate-800">{i.medicineName}</span>
                  <span className="text-slate-500">
                    {i.quantity} × {formatCurrency(i.unitPrice)} = <strong className="text-slate-800">{formatCurrency(i.quantity * i.unitPrice)}</strong>
                  </span>
                </div>
              ))}
            </div>
            {p.notes && <p className="text-[11px] text-slate-500 mt-2">Note: {p.notes}</p>}
          </Card>
        ))}
      </div>

      {/* Add purchase modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add a Purchase"
        subtitle="Record medicines you bought from a pharmacy"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-slate-900">Total: {formatCurrency(draftTotal)}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save Purchase
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pharmacy</label>
              <select
                value={pharmacyName}
                onChange={e => setPharmacyName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                {CUSTOMER_PHARMACIES.map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                max={today()}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as CustomerPurchase['paymentMethod'])}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">Medicines</label>
              <Button size="sm" variant="secondary" onClick={() => setItems(prev => [...prev, emptyItem()])} icon={<Plus className="w-3.5 h-3.5" />}>
                Add item
              </Button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-6">
                  <input
                    type="text"
                    placeholder="Medicine name (e.g. Paracetamol 500mg)"
                    value={it.medicineName}
                    onChange={e => updateItem(idx, 'medicineName', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Price (₹)"
                    value={it.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-300 hover:text-rose-600 disabled:opacity-30"
                    aria-label="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={prescriptionVerified} onChange={e => setPrescriptionVerified(e.target.checked)} />
            This purchase was made with a prescription
          </label>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
