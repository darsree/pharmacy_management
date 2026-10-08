import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Medicine, StockStatus } from '../types';
import {
  Pill,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  Receipt,
  LayoutGrid,
  List,
  MapPin,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StockStatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils';

interface MedicinesPageProps {
  onEditMedicine: (med: Medicine) => void;
}

export const MedicinesPage: React.FC<MedicinesPageProps> = ({ onEditMedicine }) => {
  const {
    medicines,
    categories,
    deleteMedicine,
    setIsAddMedicineOpen,
    setSelectedMedicineIdForDetails,
    setIsNewSaleOpen
  } = usePharmacy();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch =
        search === '' ||
        med.name.toLowerCase().includes(search.toLowerCase()) ||
        med.genericName.toLowerCase().includes(search.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || med.status === selectedStatus;
      const matchesRx =
        prescriptionFilter === 'all' ||
        (prescriptionFilter === 'rx' && med.prescriptionRequired) ||
        (prescriptionFilter === 'otc' && !med.prescriptionRequired);

      return matchesSearch && matchesCategory && matchesStatus && matchesRx;
    });
  }, [medicines, search, selectedCategory, selectedStatus, prescriptionFilter]);

  const handleExportCSV = () => {
    const headers = ['ID,Name,GenericName,Category,Manufacturer,DosageForm,Stock,UnitPrice,SellingPrice,Status,Location'];
    const rows = filteredMedicines.map(m =>
      `"${m.id}","${m.name}","${m.genericName}","${m.category}","${m.manufacturer}","${m.dosageForm}",${m.stock},${m.unitPrice},${m.sellingPrice},"${m.status}","${m.locationRack || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Medicines_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Medicines Master Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage formulations, pricing, safety classification, and stock thresholds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddMedicineOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine name, active ingredient, manufacturer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Category select */}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-700"
        >
          <option value="all">All Categories ({categories.length})</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Status select */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-700"
        >
          <option value="all">All Stock Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="critical">Critical Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        {/* Rx filter */}
        <select
          value={prescriptionFilter}
          onChange={e => setPrescriptionFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-700"
        >
          <option value="all">All Types (Rx & OTC)</option>
          <option value="rx">Prescription Only (Rx)</option>
          <option value="otc">Over the Counter (OTC)</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400'}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {filteredMedicines.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No Medicines Found"
          description="No medicines match your active search filters or catalog is empty."
          actionLabel="Add New Medicine"
          onAction={() => setIsAddMedicineOpen(true)}
        />
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Medicine Details</th>
                  <th className="py-3 px-4">Category / Type</th>
                  <th className="py-3 px-4">Dosage Form</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Price (Buy / Sell)</th>
                  <th className="py-3 px-4">Rack Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map(med => {
                  const marginPercent = Math.round(
                    ((med.sellingPrice - med.unitPrice) / (med.sellingPrice || 1)) * 100
                  );

                  return (
                    <tr
                      key={med.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedMedicineIdForDetails(med.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{med.name}</p>
                            <p className="text-[10px] text-slate-400">{med.genericName}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700">{med.category}</p>
                        {med.prescriptionRequired ? (
                          <span className="inline-block text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-sm mt-0.5">
                            Rx Schedule H
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm mt-0.5">
                            OTC
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {med.dosageForm} {med.strength && `(${med.strength})`}
                      </td>

                      <td className="py-3 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{med.stock} units</span>
                            <span className="text-[10px] text-slate-400">{med.batches.length} batches</span>
                          </div>
                          <ProgressBar current={med.stock} max={med.maxStock} threshold={med.reorderThreshold} size="sm" />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-900">{formatCurrency(med.sellingPrice)}</span>
                          <span className="text-[10px] text-slate-400">({formatCurrency(med.unitPrice)})</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">+{marginPercent}% margin</span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {med.locationRack || 'Shelf A1'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <StockStatusBadge status={med.status} />
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMedicineIdForDetails(med.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                            title="View Batches & Specs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditMedicine(med)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                            title="Edit Medicine"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMedicine(med.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                            title="Delete Medicine"
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
      ) : (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedicines.map(med => (
            <div
              key={med.id}
              onClick={() => setSelectedMedicineIdForDetails(med.id)}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">{med.name}</h3>
                    <p className="text-[10px] text-slate-400 truncate">{med.genericName}</p>
                  </div>
                  <StockStatusBadge status={med.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Category</span>
                    <span className="font-semibold text-slate-700 truncate block">{med.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dosage</span>
                    <span className="font-semibold text-slate-700 truncate block">{med.dosageForm}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Retail Price</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(med.sellingPrice)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Batches</span>
                    <span className="font-semibold text-slate-700">{med.batches.length} Active</span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Stock: {med.stock} units</span>
                    <span>Reorder at: {med.reorderThreshold}</span>
                  </div>
                  <ProgressBar current={med.stock} max={med.maxStock} threshold={med.reorderThreshold} size="sm" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {med.locationRack || 'Rack A1'}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEditMedicine(med)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMedicineIdForDetails(med.id);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
