// Customer-side data: the signed-in customer's own purchases (prototype:
// hardcoded seed + localStorage so newly added purchases survive a refresh).

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  CustomerPurchase,
  INITIAL_CUSTOMER_PURCHASES,
  customerPurchaseTotal
} from '../data/customerMockData';

const STORAGE_KEY = 'medicore_v2_customer_purchases';

const loadPurchases = (): CustomerPurchase[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as CustomerPurchase[];
    }
  } catch {
    /* fall through to seed */
  }
  return INITIAL_CUSTOMER_PURCHASES;
};

export interface NewCustomerPurchase {
  pharmacyName: string;
  date: string;
  paymentMethod: CustomerPurchase['paymentMethod'];
  items: CustomerPurchase['items'];
  prescriptionVerified: boolean;
  notes?: string;
}

export interface CustomerStats {
  totalSpent: number;
  ordersCount: number;
  itemsCount: number;
  avgOrderValue: number;
  thisMonthSpent: number;
  prescriptionOrders: number;
  uniquePharmacies: number;
  topMedicines: Array<{ name: string; quantity: number; spent: number }>;
  spendByPharmacy: Array<{ name: string; value: number }>;
  monthlySpend: Array<{ month: string; spent: number }>;
}

interface CustomerDataContextType {
  purchases: CustomerPurchase[];
  stats: CustomerStats;
  addPurchase: (p: NewCustomerPurchase) => void;
  deletePurchase: (id: string) => void;
  resetPurchases: () => void;
}

const CustomerDataContext = createContext<CustomerDataContextType | undefined>(undefined);

export const CustomerDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [purchases, setPurchases] = useState<CustomerPurchase[]>(loadPurchases);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    } catch {
      /* ignore */
    }
  }, [purchases]);

  const addPurchase = useCallback((p: NewCustomerPurchase) => {
    const n = Math.floor(7500 + Math.random() * 1500);
    const newPurchase: CustomerPurchase = {
      id: `cp-${Date.now()}`,
      orderNumber: `ORD-${n}`,
      date: p.date,
      pharmacyName: p.pharmacyName,
      items: p.items,
      total: customerPurchaseTotal(p.items),
      paymentMethod: p.paymentMethod,
      status: 'processing',
      prescriptionVerified: p.prescriptionVerified,
      notes: p.notes
    };
    setPurchases(prev => [newPurchase, ...prev]);
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetPurchases = useCallback(() => setPurchases(INITIAL_CUSTOMER_PURCHASES), []);

  const stats = useMemo<CustomerStats>(() => {
    const valid = purchases.filter(p => p.status !== undefined);
    const totalSpent = valid.reduce((s, p) => s + p.total, 0);
    const itemsCount = valid.reduce((s, p) => s + p.items.reduce((a, i) => a + i.quantity, 0), 0);

    const monthKey = new Date().toISOString().slice(0, 7);
    const thisMonthSpent = valid.filter(p => p.date.startsWith(monthKey)).reduce((s, p) => s + p.total, 0);

    const med: Record<string, { quantity: number; spent: number }> = {};
    const ph: Record<string, number> = {};
    for (const p of valid) {
      ph[p.pharmacyName] = (ph[p.pharmacyName] || 0) + p.total;
      for (const i of p.items) {
        const cur = med[i.medicineName] || { quantity: 0, spent: 0 };
        cur.quantity += i.quantity;
        cur.spent += i.quantity * i.unitPrice;
        med[i.medicineName] = cur;
      }
    }

    // Last 6 calendar months, oldest first
    const monthlySpend: CustomerStats['monthlySpend'] = [];
    const now = new Date();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlySpend.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        spent: Math.round(valid.filter(p => p.date.startsWith(key)).reduce((s, p) => s + p.total, 0))
      });
    }

    return {
      totalSpent,
      ordersCount: valid.length,
      itemsCount,
      avgOrderValue: valid.length ? totalSpent / valid.length : 0,
      thisMonthSpent,
      prescriptionOrders: valid.filter(p => p.prescriptionVerified).length,
      uniquePharmacies: Object.keys(ph).length,
      topMedicines: Object.entries(med)
        .map(([name, v]) => ({ name, quantity: v.quantity, spent: Math.round(v.spent) }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
      spendByPharmacy: Object.entries(ph)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value),
      monthlySpend
    };
  }, [purchases]);

  return (
    <CustomerDataContext.Provider value={{ purchases, stats, addPurchase, deletePurchase, resetPurchases }}>
      {children}
    </CustomerDataContext.Provider>
  );
};

export const useCustomerData = (): CustomerDataContextType => {
  const ctx = useContext(CustomerDataContext);
  if (!ctx) throw new Error('useCustomerData must be used within a CustomerDataProvider');
  return ctx;
};
