import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { PurchaseOrder } from '../types';
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  Boxes,
  FileText,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { OrderStatusBadge } from '../components/common/Badge';
import { formatCurrency, formatShortDate } from '../utils';

export const PurchasesPage: React.FC = () => {
  const {
    purchaseOrders,
    cancelPurchaseOrder,
    setIsCreatePOOpen,
    setSelectedPOForReceiving
  } = usePharmacy();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = purchaseOrders.filter(po => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      po.items.some(i => i.medicineName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Orders & Stock Inward
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track distributor replenishment orders, expected delivery dates, and receive stock into batch inventory
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreatePOOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Purchase Order
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO number, distributor, medicine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-700"
        >
          <option value="all">All Order Statuses</option>
          <option value="draft">Draft</option>
          <option value="ordered">Ordered (Pending)</option>
          <option value="received">Received (In Stock)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Purchase Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Distributor</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Items Ordered</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-600">
                    {po.poNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {po.supplierName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatShortDate(po.orderedDate)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatShortDate(po.expectedDeliveryDate)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {po.items.length} line items ({po.items.reduce((s, i) => s + i.quantity, 0)} units)
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {formatCurrency(po.total)}
                  </td>
                  <td className="py-3 px-4">
                    <OrderStatusBadge status={po.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {po.status !== 'received' && po.status !== 'cancelled' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="py-1 px-2.5 text-[11px]"
                            onClick={() => setSelectedPOForReceiving(po)}
                            icon={<Boxes className="w-3.5 h-3.5" />}
                          >
                            Receive Stock
                          </Button>
                          <button
                            type="button"
                            onClick={() => cancelPurchaseOrder(po.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                            title="Cancel PO"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
