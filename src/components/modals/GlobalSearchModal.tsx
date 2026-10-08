import React, { useState, useEffect } from 'react';
import { usePharmacy, PageRoute } from '../../context/PharmacyContext';
import { Search, Pill, Truck, Users, Receipt, ShoppingCart, ArrowRight, X } from 'lucide-react';
import { StockStatusBadge } from '../common/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    medicines,
    suppliers,
    customers,
    sales,
    purchaseOrders,
    setActivePage,
    setSelectedMedicineIdForDetails
  } = usePharmacy();

  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results
  const matchedMedicines = q
    ? medicines.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
    : [];

  const matchedSuppliers = q
    ? suppliers.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.phone.includes(q)
      )
    : [];

  const matchedCustomers = q
    ? customers.filter(
        c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
      )
    : [];

  const matchedSales = q
    ? sales.filter(
        s =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q)
      )
    : [];

  const matchedPOs = q
    ? purchaseOrders.filter(
        p => p.poNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)
      )
    : [];

  const hasAnyResults =
    matchedMedicines.length > 0 ||
    matchedSuppliers.length > 0 ||
    matchedCustomers.length > 0 ||
    matchedSales.length > 0 ||
    matchedPOs.length > 0;

  const navigateTo = (page: PageRoute, medicineId?: string) => {
    setActivePage(page);
    if (medicineId) {
      setSelectedMedicineIdForDetails(medicineId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across medicines, suppliers, customers, invoices..."
            autoFocus
            className="flex-1 text-sm bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {!q ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p className="font-medium text-slate-500">Quick Search across MediCore Database</p>
              <p className="mt-1">Type medicine name, active ingredient, invoice number, or supplier</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Paracetamol', 'Amoxicillin', 'Cipla', 'MedLine', 'INV-4024'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasAnyResults ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Medicines Results */}
              {matchedMedicines.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Medicines ({matchedMedicines.length})
                  </p>
                  <div className="space-y-1">
                    {matchedMedicines.slice(0, 5).map(m => (
                      <div
                        key={m.id}
                        onClick={() => navigateTo('medicines', m.id)}
                        className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{m.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{m.genericName} • {m.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-700">{m.stock} in stock</span>
                          <StockStatusBadge status={m.status} />
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers Results */}
              {matchedSuppliers.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Suppliers ({matchedSuppliers.length})
                  </p>
                  <div className="space-y-1">
                    {matchedSuppliers.slice(0, 3).map(s => (
                      <div
                        key={s.id}
                        onClick={() => navigateTo('suppliers')}
                        className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{s.contactPerson} • {s.phone}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{s.onTimeDeliveryRate}% on-time</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Results */}
              {matchedCustomers.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Customers ({matchedCustomers.length})
                  </p>
                  <div className="space-y-1">
                    {matchedCustomers.slice(0, 3).map(c => (
                      <div
                        key={c.id}
                        onClick={() => navigateTo('customers')}
                        className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{c.phone}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{c.tier} Tier</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Results */}
              {matchedSales.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Invoices & Sales ({matchedSales.length})
                  </p>
                  <div className="space-y-1">
                    {matchedSales.slice(0, 3).map(sale => (
                      <div
                        key={sale.id}
                        onClick={() => navigateTo('sales')}
                        className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{sale.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-400 truncate">{sale.customerName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-900">₹{sale.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
