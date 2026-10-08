import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Layers, Plus, Trash2, Pill, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const CategoriesPage: React.FC = () => {
  const { categories, addCategory, deleteCategory, medicines, setActivePage } = usePharmacy();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<string>('#3b82f6');

  const colorPalette = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#64748b'  // slate
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name,
      description,
      color,
      iconName: 'Pill'
    });

    setName('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Therapeutic Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize medicine formulations by therapeutic classification & clinical family
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(cat => {
          const matchingMedicines = medicines.filter(m => m.category === cat.name);
          const totalStockUnits = matchingMedicines.reduce((s, m) => s + m.stock, 0);

          return (
            <div
              key={cat.id}
              className="p-5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color || '#3b82f6' }}
                    />
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  </div>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {cat.description || 'Therapeutic class formulations and active molecules.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Formulations</span>
                    <span className="font-bold text-slate-800">{matchingMedicines.length} Medicines</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Units</span>
                    <span className="font-bold text-slate-800">{totalStockUnits} in Stock</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs text-blue-600 hover:bg-blue-50"
                onClick={() => setActivePage('medicines')}
              >
                <span>View Medicines</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Therapeutic Category"
        subtitle="Create a new classification category for pharmacy medicines"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Create Category
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Antidiabetic, Dermatological"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Indications, ATC code notes, or storage rules..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-2">
              {colorPalette.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
