// MediCore - Prototype data layer (hardcoded seed data + browser localStorage).
//
// The prototype no longer depends on Supabase. On first load every table is
// seeded from src/data/mockData.ts; later edits are saved to localStorage so
// they survive a refresh. "Reset Demo Data" restores the hardcoded seed.
// Same function names/shape as before, so PharmacyContext is unchanged.

import {
  Medicine,
  Category,
  Supplier,
  Customer,
  Sale,
  PurchaseOrder,
  PharmacyNotification,
  PharmacySettings,
  GenericSuggestion
} from '../types';
import {
  INITIAL_MEDICINES,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_GENERIC_SUGGESTIONS,
  INITIAL_SETTINGS
} from '../data/mockData';

// Bump this if the seed data shape changes so stale saved data is discarded.
const VERSION = 'v2';
const key = (name: string) => `medicore_${VERSION}_${name}`;

function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    // An empty saved list would leave a page blank; fall back to the seed.
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function save<T>(name: string, value: T): void {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    /* storage full/unavailable: the app keeps working in memory */
  }
}

export const storageService = {
  async initializeData(): Promise<void> {
    /* nothing to do: load() falls back to the hardcoded seed */
  },

  async resetAllToDefault(): Promise<void> {
    ['medicines', 'categories', 'suppliers', 'customers', 'sales', 'purchases', 'notifications', 'settings', 'generics']
      .forEach(n => {
        try {
          localStorage.removeItem(key(n));
        } catch {
          /* ignore */
        }
      });
  },

  async getMedicines(): Promise<Medicine[]> { return load('medicines', INITIAL_MEDICINES); },
  async saveMedicines(v: Medicine[]): Promise<void> { save('medicines', v); },

  async getCategories(): Promise<Category[]> { return load('categories', INITIAL_CATEGORIES); },
  async saveCategories(v: Category[]): Promise<void> { save('categories', v); },

  async getSuppliers(): Promise<Supplier[]> { return load('suppliers', INITIAL_SUPPLIERS); },
  async saveSuppliers(v: Supplier[]): Promise<void> { save('suppliers', v); },

  async getCustomers(): Promise<Customer[]> { return load('customers', INITIAL_CUSTOMERS); },
  async saveCustomers(v: Customer[]): Promise<void> { save('customers', v); },

  async getSales(): Promise<Sale[]> { return load('sales', INITIAL_SALES); },
  async saveSales(v: Sale[]): Promise<void> { save('sales', v); },

  async getPurchases(): Promise<PurchaseOrder[]> { return load('purchases', INITIAL_PURCHASE_ORDERS); },
  async savePurchases(v: PurchaseOrder[]): Promise<void> { save('purchases', v); },

  async getNotifications(): Promise<PharmacyNotification[]> { return load('notifications', INITIAL_NOTIFICATIONS); },
  async saveNotifications(v: PharmacyNotification[]): Promise<void> { save('notifications', v); },

  async getSettings(): Promise<PharmacySettings> { return load('settings', INITIAL_SETTINGS); },
  async saveSettings(v: PharmacySettings): Promise<void> { save('settings', v); },

  async getGenerics(): Promise<GenericSuggestion[]> { return load('generics', INITIAL_GENERIC_SUGGESTIONS); },
  async saveGenerics(v: GenericSuggestion[]): Promise<void> { save('generics', v); }
};
