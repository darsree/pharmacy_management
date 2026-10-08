import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  Save,
  RotateCcw,
  Store,
  ShieldCheck,
  User,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = usePharmacy();

  const [businessName, setBusinessName] = useState<string>(settings.business.pharmacyName);
  const [address, setAddress] = useState<string>(settings.business.address);
  const [phone, setPhone] = useState<string>(settings.business.phone);
  const [gstNumber, setGstNumber] = useState<string>(settings.business.gstNumber);
  const [licenseNumber, setLicenseNumber] = useState<string>(settings.business.licenseNumber);
  const [currencySymbol, setCurrencySymbol] = useState<string>(settings.business.currencySymbol);
  const [lowStockDefault, setLowStockDefault] = useState<number>(settings.business.lowStockThresholdDefault);
  const [nearExpiryDays, setNearExpiryDays] = useState<number>(settings.business.nearExpiryDaysDefault);

  const [pharmacistName, setPharmacistName] = useState<string>(settings.profile.name);
  const [pharmacistRole, setPharmacistRole] = useState<string>(settings.profile.role);
  const [pharmacistEmail, setPharmacistEmail] = useState<string>(settings.profile.email);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      profile: {
        ...settings.profile,
        name: pharmacistName,
        role: pharmacistRole,
        email: pharmacistEmail
      },
      business: {
        ...settings.business,
        pharmacyName: businessName,
        address,
        phone,
        gstNumber,
        licenseNumber,
        currencySymbol,
        lowStockThresholdDefault: lowStockDefault,
        nearExpiryDaysDefault: nearExpiryDays
      }
    });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all inventory and clinical data to fresh demo defaults?')) {
      resetToDemoData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          System & Pharmacy Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure pharmacy entity information, Drug License numbers, GST compliance, and data backups
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pharmacy Profile */}
        <Card>
          <CardHeader
            title="Pharmacy Entity & Tax Details"
            subtitle="Details displayed on customer invoices and official purchase orders"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pharmacy Registered Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drug License Number (DL No.) *
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN / Tax Registration *
                </label>
                <input
                  type="text"
                  required
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pharmacy Physical Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Pharmacist Profile */}
        <Card>
          <CardHeader
            title="Operating Pharmacist Profile"
            subtitle="Designation and contact info affixed to POS sales invoices"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={pharmacistName}
                  onChange={e => setPharmacistName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={pharmacistRole}
                  onChange={e => setPharmacistRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={pharmacistEmail}
                  onChange={e => setPharmacistEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Thresholds */}
        <Card>
          <CardHeader
            title="Inventory & Expiry Warning Thresholds"
            subtitle="Automated warning parameters for near-expiry and low-stock alerts"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Low-Stock Threshold (Units)
                </label>
                <input
                  type="number"
                  min={1}
                  value={lowStockDefault}
                  onChange={e => setLowStockDefault(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Near-Expiry Alert Window (Days)
                </label>
                <input
                  type="number"
                  min={7}
                  value={nearExpiryDays}
                  onChange={e => setNearExpiryDays(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Database Management / Demo Data Reset */}
      <Card className="border-rose-200">
        <CardHeader
          title="Data Management & Demo Restore"
          subtitle="Clear local storage cache or re-seed standard demonstration inventory"
        />
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-600">
            Resetting data will restore the default catalog with clinical interactions, multiple batch expiries, suppliers, and customer loyalty records.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset All Data to Demo Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
