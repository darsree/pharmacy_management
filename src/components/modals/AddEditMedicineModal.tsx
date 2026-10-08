import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Medicine, DosageForm } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface AddEditMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineToEdit?: Medicine | null;
}

export const AddEditMedicineModal: React.FC<AddEditMedicineModalProps> = ({
  isOpen,
  onClose,
  medicineToEdit
}) => {
  const { categories, suppliers, addMedicine, updateMedicine } = usePharmacy();

  const isEditing = !!medicineToEdit;

  // Form states
  const [name, setName] = useState<string>('');
  const [genericName, setGenericName] = useState<string>('');
  const [category, setCategory] = useState<string>('Analgesic');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [dosageForm, setDosageForm] = useState<DosageForm>('Tablet');
  const [strength, setStrength] = useState<string>('');
  const [prescriptionRequired, setPrescriptionRequired] = useState<boolean>(false);
  const [unitPrice, setUnitPrice] = useState<number>(2.0);
  const [sellingPrice, setSellingPrice] = useState<number>(4.5);
  const [stock, setStock] = useState<number>(100);
  const [reorderThreshold, setReorderThreshold] = useState<number>(50);
  const [maxStock, setMaxStock] = useState<number>(300);
  const [supplierId, setSupplierId] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('2027-12-31');
  const [locationRack, setLocationRack] = useState<string>('Rack A-01');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (medicineToEdit) {
      setName(medicineToEdit.name);
      setGenericName(medicineToEdit.genericName);
      setCategory(medicineToEdit.category);
      setManufacturer(medicineToEdit.manufacturer);
      setDosageForm(medicineToEdit.dosageForm);
      setStrength(medicineToEdit.strength);
      setPrescriptionRequired(medicineToEdit.prescriptionRequired);
      setUnitPrice(medicineToEdit.unitPrice);
      setSellingPrice(medicineToEdit.sellingPrice);
      setStock(medicineToEdit.stock);
      setReorderThreshold(medicineToEdit.reorderThreshold);
      setMaxStock(medicineToEdit.maxStock);
      setSupplierId(medicineToEdit.supplierId);
      setLocationRack(medicineToEdit.locationRack || 'Rack A-01');
      setDescription(medicineToEdit.description || '');
      setBatchNumber('');
    } else {
      setName('');
      setGenericName('');
      setCategory(categories[0]?.name || 'Analgesic');
      setManufacturer('');
      setDosageForm('Tablet');
      setStrength('');
      setPrescriptionRequired(false);
      setUnitPrice(2.5);
      setSellingPrice(5.0);
      setStock(80);
      setReorderThreshold(50);
      setMaxStock(250);
      setSupplierId(suppliers[0]?.id || '');
      setBatchNumber(`B-${Math.floor(1000 + Math.random() * 9000)}`);
      setExpiryDate('2027-12-31');
      setLocationRack('Rack A-01');
      setDescription('');
    }
    setErrors({});
  }, [medicineToEdit, isOpen, categories, suppliers]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Medicine name is required';
    if (!genericName.trim()) newErrors.genericName = 'Generic chemical name is required';
    if (!category) newErrors.category = 'Category is required';
    if (unitPrice < 0) newErrors.unitPrice = 'Purchase price cannot be negative';
    if (sellingPrice < 0) newErrors.sellingPrice = 'Selling price cannot be negative';
    if (stock < 0) newErrors.stock = 'Stock quantity cannot be negative';
    if (reorderThreshold <= 0) newErrors.reorderThreshold = 'Reorder threshold must be greater than 0';
    if (!isEditing && !batchNumber.trim()) newErrors.batchNumber = 'Initial batch number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedSupplier = suppliers.find(s => s.id === supplierId) || suppliers[0];

    if (isEditing && medicineToEdit) {
      updateMedicine(medicineToEdit.id, {
        name,
        genericName,
        category,
        manufacturer,
        dosageForm,
        strength,
        prescriptionRequired,
        unitPrice: Number(unitPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        reorderThreshold: Number(reorderThreshold),
        maxStock: Number(maxStock),
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        locationRack,
        description
      });
    } else {
      addMedicine(
        {
          name,
          genericName,
          category,
          manufacturer,
          dosageForm,
          strength,
          prescriptionRequired,
          unitPrice: Number(unitPrice),
          sellingPrice: Number(sellingPrice),
          stock: Number(stock),
          reorderThreshold: Number(reorderThreshold),
          maxStock: Number(maxStock),
          supplierId: selectedSupplier.id,
          supplierName: selectedSupplier.name,
          locationRack,
          description
        },
        {
          batchNumber,
          expiryDate,
          quantity: Number(stock),
          purchasePrice: Number(unitPrice),
          sellingPrice: Number(sellingPrice)
        }
      );
    }

    onClose();
  };

  const dosageForms: DosageForm[] = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Cream',
    'Ointment',
    'Inhaler',
    'Drops',
    'Powder'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${medicineToEdit?.name}` : 'Add New Medicine'}
      subtitle={isEditing ? 'Update catalog details & pricing' : 'Create new medicine entry and initial batch'}
      maxWidth="3xl"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Add Medicine to Catalog'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Medicine Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className={`w-full px-3 py-2 text-xs border rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Generic Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Molecule / Generic Name *
            </label>
            <input
              type="text"
              value={genericName}
              onChange={e => setGenericName(e.target.value)}
              placeholder="e.g. Acetaminophen"
              className={`w-full px-3 py-2 text-xs border rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                errors.genericName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {errors.genericName && <p className="text-[10px] text-rose-500 mt-1">{errors.genericName}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Therapeutic Category *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              value={manufacturer}
              onChange={e => setManufacturer(e.target.value)}
              placeholder="e.g. Cipla Ltd."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Dosage Form */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dosage Form
            </label>
            <select
              value={dosageForm}
              onChange={e => setDosageForm(e.target.value as DosageForm)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {dosageForms.map(f => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Strength */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Strength / Formulation
            </label>
            <input
              type="text"
              value={strength}
              onChange={e => setStrength(e.target.value)}
              placeholder="e.g. 500mg, 100mcg/dose"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Unit Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selling Retail Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Stock & Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Stock Units *
            </label>
            <input
              type="number"
              value={stock}
              onChange={e => setStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reorder Alert Threshold *
            </label>
            <input
              type="number"
              value={reorderThreshold}
              onChange={e => setReorderThreshold(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Primary Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Supplier
            </label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rack Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Storage Rack Location
            </label>
            <input
              type="text"
              value={locationRack}
              onChange={e => setLocationRack(e.target.value)}
              placeholder="e.g. Rack A-02, Shelf 3"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Batch section for new medicine */}
        {!isEditing && (
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold text-blue-900">Initial Batch Tracking</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  placeholder="e.g. B2291"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Prescription Required Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="rx-req"
            checked={prescriptionRequired}
            onChange={e => setPrescriptionRequired(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="rx-req" className="text-xs font-medium text-slate-700 cursor-pointer">
            Prescription Required (Schedule H / Rx Only)
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Clinical Notes & Indications
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Indications, precautions, dosage guidelines..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </form>
    </Modal>
  );
};
