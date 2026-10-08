import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Search, Plus, Trash2, ShieldAlert, CheckCircle2, Receipt, CreditCard, Banknote, QrCode, Printer } from 'lucide-react';
import { formatCurrency, formatShortDate, allocateBatchesExpiryFirst } from '../../utils';
import { StockStatusBadge } from '../common/Badge';

interface NewSalePosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosageForm: string;
  sellingPrice: number;
  quantity: number;
  availableStock: number;
  prescriptionRequired: boolean;
  allocatedBatches: Array<{
    batchNumber: string;
    expiryDate: string;
    quantity: number;
  }>;
}

export const NewSalePosModal: React.FC<NewSalePosModalProps> = ({ isOpen, onClose }) => {
  const { medicines, customers, completeSale, settings } = usePharmacy();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walkin');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [notes, setNotes] = useState<string>('');

  // Invoice success state
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  // Filter medicines for adding
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return medicines
      .filter(
        m =>
          m.stock > 0 &&
          (m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [medicines, searchQuery]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCustomerId(val);
    if (val === 'walkin') {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setDiscountPercent(0);
    } else {
      const cust = customers.find(c => c.id === val);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        // Tier discount
        if (cust.tier === 'VIP') setDiscountPercent(10);
        else setDiscountPercent(0);
      }
    }
  };

  const addToCart = (med: (typeof medicines)[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === med.id);
      const newQty = existing ? existing.quantity + 1 : 1;

      if (newQty > med.stock) return prev;

      // Calculate FIFO allocation
      const alloc = allocateBatchesExpiryFirst(med, newQty);
      const allocatedBatches = alloc.allocations.map(a => ({
        batchNumber: a.batch.batchNumber,
        expiryDate: a.batch.expiryDate,
        quantity: a.allocatedQty
      }));

      if (existing) {
        return prev.map(item =>
          item.medicineId === med.id
            ? { ...item, quantity: newQty, allocatedBatches }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicineId: med.id,
            medicineName: med.name,
            genericName: med.genericName,
            dosageForm: med.dosageForm,
            sellingPrice: med.sellingPrice,
            quantity: 1,
            availableStock: med.stock,
            prescriptionRequired: med.prescriptionRequired,
            allocatedBatches
          }
        ];
      }
    });
    setSearchQuery('');
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    setCart(prev =>
      prev
        .map(item => {
          if (item.medicineId !== medicineId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > med.stock) return item;

          const alloc = allocateBatchesExpiryFirst(med, newQty);
          return {
            ...item,
            quantity: newQty,
            allocatedBatches: alloc.allocations.map(a => ({
              batchNumber: a.batch.batchNumber,
              expiryDate: a.batch.expiryDate,
              quantity: a.allocatedQty
            }))
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(item => item.medicineId !== medicineId));
  };

  // Computations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.05; // 5% GST
  const grandTotal = taxableAmount + taxAmount;

  const hasPrescriptionItems = cart.some(item => item.prescriptionRequired);

  const handleCheckout = () => {
    if (!cart.length) return;

    const res = completeSale({
      customerId: selectedCustomerId,
      customerName,
      customerPhone,
      items: cart.map(c => ({ medicineId: c.medicineId, quantity: c.quantity })),
      paymentMethod,
      discountPercentage: discountPercent,
      notes
    });

    if (res.success) {
      setCompletedInvoice({
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString(),
        customerName,
        customerPhone,
        items: [...cart],
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        paymentMethod
      });
    }
  };

  const resetModal = () => {
    setCart([]);
    setDiscountPercent(0);
    setSearchQuery('');
    setCompletedInvoice(null);
    onClose();
  };

  if (completedInvoice) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={resetModal}
        title="Sale Completed Successfully"
        subtitle={`Invoice generated for ${completedInvoice.customerName}`}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Receipt
            </Button>
            <Button variant="primary" onClick={resetModal}>
              New Transaction
            </Button>
          </>
        }
      >
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-base font-bold text-slate-900">{settings.business.pharmacyName}</p>
              <p className="text-[11px] text-slate-500">{settings.business.address} • GSTIN: {settings.business.gstNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-blue-600">{completedInvoice.invoiceNumber}</p>
              <p className="text-[10px] text-slate-400">{completedInvoice.date}</p>
            </div>
          </div>

          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Customer: </span>
            {completedInvoice.customerName} {completedInvoice.customerPhone ? `(${completedInvoice.customerPhone})` : ''}
          </div>

          <div className="divide-y divide-slate-200 text-xs">
            {completedInvoice.items.map((item: CartItem) => (
              <div key={item.medicineId} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{item.medicineName}</p>
                  <p className="text-[10px] text-slate-400">
                    Allocated: {item.allocatedBatches.map(b => `${b.batchNumber} (Exp: ${b.expiryDate}) [${b.quantity}]`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.quantity} x {formatCurrency(item.sellingPrice)}</p>
                  <p className="text-slate-500">{formatCurrency(item.quantity * item.sellingPrice)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(completedInvoice.subtotal)}</span>
            </div>
            {completedInvoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(completedInvoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST (5%)</span>
              <span>{formatCurrency(completedInvoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid ({completedInvoice.paymentMethod})</span>
              <span>{formatCurrency(completedInvoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Point of Sale (POS) & Dispensing"
      subtitle="Dispense medicines with automated First-Expiring Batch Allocation"
      maxWidth="4xl"
      footer={
        <>
          <div className="flex items-center gap-2 mr-auto text-xs text-slate-500">
            <span>Total Items: <strong>{cart.reduce((s, i) => s + i.quantity, 0)}</strong></span>
            <span>•</span>
            <span>Grand Total: <strong className="text-slate-900 text-sm">{formatCurrency(grandTotal)}</strong></span>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            icon={<Receipt className="w-4 h-4" />}
          >
            Complete Sale ({formatCurrency(grandTotal)})
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Customer & Medicine Selection */}
        <div className="lg:col-span-7 space-y-4">
          {/* Customer Selection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Customer Selection</label>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-hidden"
              >
                <option value="walkin">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.tier}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId === 'walkin' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={customerName === 'Walk-in Customer' ? '' : customerName}
                  onChange={e => setCustomerName(e.target.value || 'Walk-in Customer')}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Phone (Optional)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Medicine Search */}
          <div className="relative">
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search medicine to dispense (e.g. Paracetamol, Cipla...)"
                className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Dropdown matches */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {searchResults.map(med => (
                  <div
                    key={med.id}
                    onClick={() => addToCart(med)}
                    className="p-2.5 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">{med.name}</span>
                        {med.prescriptionRequired && (
                          <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded-sm font-semibold">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{med.genericName} • Stock: {med.stock} units</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-800">{formatCurrency(med.sellingPrice)}</span>
                      <Button size="sm" variant="secondary" icon={<Plus className="w-3 h-3" />}>
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescription Alert Notice */}
          {hasPrescriptionItems && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Schedule H / Rx Items detected:</strong> Verify valid doctor prescription before dispensing antibiotics or controlled substances.
              </p>
            </div>
          )}

          {/* Cart items list */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Selected Items ({cart.length})</h4>
            {cart.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                Search and add medicines above to build invoice.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div
                    key={item.medicineId}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.medicineName}</p>
                        {item.prescriptionRequired && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded-sm font-bold">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{item.genericName} • {item.dosageForm}</p>
                      
                      {/* FIFO Batch allocation preview */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.allocatedBatches.map((b, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-medium"
                          >
                            FIFO Batch: {b.batchNumber} (Exp: {formatShortDate(b.expiryDate)}) - {b.quantity}u
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicineId, -1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-xs font-bold bg-white text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicineId, 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-bold text-slate-800">
                          {formatCurrency(item.quantity * item.sellingPrice)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          @{formatCurrency(item.sellingPrice)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.medicineId)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Payment & Calculation */}
        <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payment Breakdown</h4>

            {/* Subtotal */}
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Discount %</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded-lg"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Discount Savings</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {/* GST */}
            <div className="flex justify-between text-xs text-slate-600">
              <span>GST (5% Formulation)</span>
              <span>+{formatCurrency(taxAmount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Payable</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'Cash'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'Card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Dispensing Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Prescription No. / Doctor Name..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
