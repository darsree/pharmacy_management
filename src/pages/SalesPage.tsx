import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Sale } from '../types';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  Calendar,
  IndianRupee,
  Eye,
  CheckCircle2,
  FileText,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatShortDate } from '../utils';

export const SalesPage: React.FC = () => {
  const { sales, setIsNewSaleOpen, settings } = usePharmacy();

  const [search, setSearch] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(s => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.items.some(i => i.medicineName.toLowerCase().includes(search.toLowerCase()));

    const matchesPayment = paymentFilter === 'all' || s.paymentMethod.toLowerCase().includes(paymentFilter.toLowerCase());

    return matchesSearch && matchesPayment;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales Invoices & Dispensing Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of point-of-sale transactions, batch allocations, tax breakdowns, and payment channels
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewSaleOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Sale / POS Checkout
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, patient name, or medicine..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Payment:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              {(['all', 'Cash', 'UPI', 'Card'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPaymentFilter(p)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                    paymentFilter === p ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader
          title={`All Invoices (${filteredSales.length})`}
          subtitle="Showing chronological sales history and batch allocation records"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Dispensed</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sales invoices match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatShortDate(sale.date)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{sale.customerName}</p>
                      <p className="text-[10px] text-slate-400">{sale.customerPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{sale.items.length} item(s)</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">
                        {sale.items.map(i => `${i.medicineName} (${i.quantity})`).join(', ')}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {sale.paymentMethod === 'UPI' ? <QrCode className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSale(sale)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Bill
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Detail / Receipt Print Modal */}
      {selectedSale && (
        <Modal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          title={`Tax Invoice: ${selectedSale.invoiceNumber}`}
          size="md"
          footer={
            <div className="flex justify-between w-full items-center">
              <span className="text-[11px] text-slate-400">
                Authorized System Signature Generated
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                  Close
                </Button>
                <Button variant="primary" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
                  Print Receipt
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 printable-bill">
            {/* Header branding */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{settings.business.pharmacyName}</h3>
                <p className="text-[11px] text-slate-500">{settings.business.address}</p>
                <p className="text-[10px] text-slate-400">
                  DL No: {settings.business.licenseNumber} • GSTIN: {settings.business.gstNumber}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                <p className="font-bold text-slate-800">{selectedSale.customerName}</p>
                <p className="text-[11px] text-slate-500">{selectedSale.customerPhone || 'Walk-in Customer'}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3">Batch & Exp</th>
                  <th className="py-2 px-3 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSale.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.medicineName}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {item.batchNumber} (Exp: {formatShortDate(item.expiryDate)})
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Calculation */}
            <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Special Discount:</span>
                  <span>- {formatCurrency(selectedSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST Tax:</span>
                <span>{formatCurrency(selectedSale.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatCurrency(selectedSale.total)}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-left pt-1">
                Payment Channel: <strong>{selectedSale.paymentMethod}</strong> • Pharmacist: {selectedSale.pharmacistName}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
