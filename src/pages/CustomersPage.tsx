import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Customer } from '../types';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Receipt,
  Trash2,
  Edit2,
  ShieldAlert,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatShortDate } from '../utils';

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, setIsNewSaleOpen } = usePharmacy();

  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [tier, setTier] = useState<'VIP' | 'Regular'>('Regular');
  const [allergiesText, setAllergiesText] = useState<string>('');

  const filtered = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTier('Regular');
    setAllergiesText('');
    setIsModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setAddress(c.address);
    setTier(c.tier);
    setAllergiesText((c.allergies || []).join(', '));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedAllergies = allergiesText
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        phone,
        email,
        address,
        tier,
        allergies: parsedAllergies
      });
    } else {
      addCustomer({
        name,
        phone,
        email,
        address,
        tier,
        allergies: parsedAllergies,
        chronicConditions: [],
        frequentMedicines: []
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer & Patient Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient history, known drug allergies, loyalty tiers, and lifetime dispensing totals
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openAdd} icon={<Plus className="w-4 h-4" />}>
          Add Customer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, phone number, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cust => (
          <div
            key={cust.id}
            className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {cust.phone}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    cust.tier === 'VIP'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  {cust.tier}
                </span>
              </div>

              {/* Allergies Warning */}
              {cust.allergies && cust.allergies.length > 0 && (
                <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Allergies: </strong>
                    {cust.allergies.join(', ')}
                  </span>
                </div>
              )}

              {/* Spending & Activity */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Total Spent</span>
                  <span className="font-bold text-slate-800">{formatCurrency(cust.totalSpent)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Orders</span>
                  <span className="font-bold text-slate-800">{cust.ordersCount} Invoices</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(cust)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                  title="Edit Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {customers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteCustomer(cust.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewSaleOpen(true)}
                icon={<Receipt className="w-3.5 h-3.5" />}
              >
                New Invoice
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Patient Profile' : 'Add New Patient Record'}
        subtitle="Demographics, drug allergies, and customer discount tier"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingCustomer ? 'Save Profile' : 'Add Record'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vikram Singh"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loyalty Tier
              </label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="Regular">Regular (Standard)</option>
                <option value="VIP">VIP (10% off)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="patient@example.com"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Known Drug Allergies (Comma separated)
            </label>
            <input
              type="text"
              value={allergiesText}
              onChange={e => setAllergiesText(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa, Aspirin"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Apartment, Street, City..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
