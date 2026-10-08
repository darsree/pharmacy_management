// MediCore - Supabase Persistence & Data Service Layer
// Matches the ACTUAL schema in your Supabase project: batches live as a
// jsonb column inside each medicine row, and items live as a jsonb column
// inside each sale / purchase order row (no separate child tables).
// Every function keeps the same name/shape as the old localStorage version,
// just async now. PharmacyContext.tsx awaits these on load and calls them
// (fire-and-forget) on save.

import { supabase } from './supabaseClient';
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

// ---------- mapping helpers: DB (snake_case) <-> App (camelCase) ----------

const medicineToRow = (m: Medicine) => ({
  id: m.id,
  name: m.name,
  generic_name: m.genericName,
  category: m.category,
  manufacturer: m.manufacturer,
  dosage_form: m.dosageForm,
  strength: m.strength,
  prescription_required: m.prescriptionRequired,
  unit_price: m.unitPrice,
  selling_price: m.sellingPrice,
  stock: m.stock,
  reorder_threshold: m.reorderThreshold,
  max_stock: m.maxStock,
  supplier_id: m.supplierId || null,
  supplier_name: m.supplierName,
  description: m.description,
  side_effects: m.sideEffects,
  contraindications: m.contraindications,
  location_rack: m.locationRack,
  batches: m.batches || [], // jsonb column, stored as-is (already camelCase objects)
  status: m.status,
  units_sold_total: m.unitsSoldTotal || 0,
  revenue_total: m.revenueTotal || 0,
  created_at: m.createdAt,
  updated_at: m.updatedAt
});

const rowToMedicine = (r: any): Medicine => ({
  id: r.id,
  name: r.name,
  genericName: r.generic_name,
  category: r.category,
  manufacturer: r.manufacturer,
  dosageForm: r.dosage_form,
  strength: r.strength,
  prescriptionRequired: r.prescription_required,
  unitPrice: Number(r.unit_price),
  sellingPrice: Number(r.selling_price),
  stock: r.stock,
  reorderThreshold: r.reorder_threshold,
  maxStock: r.max_stock,
  supplierId: r.supplier_id,
  supplierName: r.supplier_name,
  description: r.description,
  sideEffects: r.side_effects,
  contraindications: r.contraindications,
  locationRack: r.location_rack,
  batches: r.batches || [], // jsonb -> already an array of Batch-shaped objects
  status: r.status,
  unitsSoldTotal: r.units_sold_total,
  revenueTotal: Number(r.revenue_total || 0),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

const categoryToRow = (c: Category) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  icon_name: c.iconName,
  color: c.color,
  medicine_count: c.medicineCount
});
const rowToCategory = (r: any): Category => ({
  id: r.id,
  name: r.name,
  description: r.description,
  iconName: r.icon_name,
  color: r.color,
  medicineCount: r.medicine_count
});

const supplierToRow = (s: Supplier) => ({
  id: s.id,
  name: s.name,
  contact_person: s.contactPerson,
  phone: s.phone,
  email: s.email,
  address: s.address,
  gst_number: s.gstNumber,
  open_purchase_orders: s.openPurchaseOrders,
  on_time_delivery_rate: s.onTimeDeliveryRate,
  status: s.status,
  rating: s.rating,
  payment_terms: s.paymentTerms
});
const rowToSupplier = (r: any): Supplier => ({
  id: r.id,
  name: r.name,
  contactPerson: r.contact_person,
  phone: r.phone,
  email: r.email,
  address: r.address,
  gstNumber: r.gst_number,
  openPurchaseOrders: r.open_purchase_orders,
  onTimeDeliveryRate: Number(r.on_time_delivery_rate),
  status: r.status,
  rating: Number(r.rating),
  paymentTerms: r.payment_terms
});

const customerToRow = (c: Customer) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  email: c.email,
  address: c.address,
  orders_count: c.ordersCount,
  total_spent: c.totalSpent,
  last_purchase_date: c.lastPurchaseDate || 'Never',
  tier: c.tier,
  allergies: c.allergies || [],
  chronic_conditions: c.chronicConditions || [],
  frequent_medicines: c.frequentMedicines || []
});
const rowToCustomer = (r: any): Customer => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  address: r.address,
  ordersCount: r.orders_count,
  totalSpent: Number(r.total_spent),
  lastPurchaseDate: r.last_purchase_date,
  tier: r.tier,
  allergies: r.allergies || [],
  chronicConditions: r.chronic_conditions || [],
  frequentMedicines: r.frequent_medicines || []
});

const saleToRow = (s: Sale) => ({
  id: s.id,
  invoice_number: s.invoiceNumber,
  customer_id: s.customerId || 'walkin',
  customer_name: s.customerName,
  customer_phone: s.customerPhone,
  date: s.date,
  items: s.items || [], // jsonb column
  subtotal: s.subtotal,
  discount: s.discount,
  tax: s.tax,
  total: s.total,
  payment_method: s.paymentMethod,
  status: s.status,
  pharmacist_name: s.pharmacistName,
  notes: s.notes || null
});
const rowToSale = (r: any): Sale => ({
  id: r.id,
  invoiceNumber: r.invoice_number,
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerPhone: r.customer_phone,
  date: r.date,
  items: r.items || [],
  subtotal: Number(r.subtotal),
  discount: Number(r.discount),
  tax: Number(r.tax),
  total: Number(r.total),
  paymentMethod: r.payment_method,
  status: r.status,
  pharmacistName: r.pharmacist_name,
  notes: r.notes
});

const poToRow = (p: PurchaseOrder) => ({
  id: p.id,
  po_number: p.poNumber,
  supplier_id: p.supplierId || null,
  supplier_name: p.supplierName,
  ordered_date: p.orderedDate,
  expected_delivery_date: p.expectedDeliveryDate,
  received_date: p.receivedDate || null,
  items: p.items || [], // jsonb column
  subtotal: p.subtotal,
  tax: p.tax,
  total: p.total,
  status: p.status,
  notes: p.notes || null
});
const rowToPO = (r: any): PurchaseOrder => ({
  id: r.id,
  poNumber: r.po_number,
  supplierId: r.supplier_id,
  supplierName: r.supplier_name,
  orderedDate: r.ordered_date,
  expectedDeliveryDate: r.expected_delivery_date,
  receivedDate: r.received_date,
  items: r.items || [],
  subtotal: Number(r.subtotal),
  tax: Number(r.tax),
  total: Number(r.total),
  status: r.status,
  notes: r.notes
});

const notificationToRow = (n: PharmacyNotification) => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.type,
  priority: n.priority,
  timestamp: n.timestamp,
  read: n.read,
  link_route: n.linkRoute || null,
  related_entity_id: n.relatedEntityId || null
});
const rowToNotification = (r: any): PharmacyNotification => ({
  id: r.id,
  title: r.title,
  message: r.message,
  type: r.type,
  priority: r.priority,
  timestamp: r.timestamp,
  read: r.read,
  linkRoute: r.link_route,
  relatedEntityId: r.related_entity_id
});

const genericToRow = (g: GenericSuggestion) => ({
  id: g.id,
  brand_medicine: g.brandMedicine,
  active_ingredient: g.activeIngredient,
  strength: g.strength,
  dosage_form: g.dosageForm,
  possible_generic: g.possibleGeneric,
  brand_price: g.brandPrice,
  generic_price: g.genericPrice,
  savings_percent: g.savingsPercent,
  availability: g.availability,
  inventory_stock: g.inventoryStock,
  reason: g.reason,
  manufacturer: g.manufacturer
});
const rowToGeneric = (r: any): GenericSuggestion => ({
  id: r.id,
  brandMedicine: r.brand_medicine,
  activeIngredient: r.active_ingredient,
  strength: r.strength,
  dosageForm: r.dosage_form,
  possibleGeneric: r.possible_generic,
  brandPrice: Number(r.brand_price),
  genericPrice: Number(r.generic_price),
  savingsPercent: Number(r.savings_percent),
  availability: r.availability,
  inventoryStock: r.inventory_stock,
  reason: r.reason,
  manufacturer: r.manufacturer
});

// Replace-all-rows helper: deletes everything in a table, then bulk inserts
// the current in-memory array. Mirrors the old "overwrite whole blob" model
// that localStorage used, which is what the rest of the app already expects.
async function replaceAll(table: string, rows: any[]) {
  const { error: delErr } = await supabase.from(table).delete().neq('id', '__none__');
  if (delErr) console.error(`Error clearing ${table}:`, delErr);
  if (rows.length === 0) return;
  const { error: insErr } = await supabase.from(table).insert(rows);
  if (insErr) console.error(`Error inserting into ${table}:`, insErr);
}

export const storageService = {
  // Seeds the database with mock data ONLY if it's completely empty.
  // Safe to call every app load.
  async initializeData(): Promise<void> {
    try {
      const { count } = await supabase.from('medicines').select('id', { count: 'exact', head: true });
      if (!count || count === 0) {
        await this.resetAllToDefault();
      }
    } catch (e) {
      console.warn('Supabase error during init:', e);
    }
  },

  async resetAllToDefault(): Promise<void> {
    await this.saveCategories(INITIAL_CATEGORIES);
    await this.saveSuppliers(INITIAL_SUPPLIERS);
    await this.saveCustomers(INITIAL_CUSTOMERS);
    await this.saveMedicines(INITIAL_MEDICINES);
    await this.saveSales(INITIAL_SALES);
    await this.savePurchases(INITIAL_PURCHASE_ORDERS);
    await this.saveNotifications(INITIAL_NOTIFICATIONS);
    await this.saveGenerics(INITIAL_GENERIC_SUGGESTIONS);
    await this.saveSettings(INITIAL_SETTINGS);
  },

  async getMedicines(): Promise<Medicine[]> {
    try {
      const { data, error } = await supabase.from('medicines').select('*');
      if (error || !data) { console.error('Error loading medicines:', error); return INITIAL_MEDICINES; }
      return data.map(rowToMedicine);
    } catch (e) {
      console.error('Error loading medicines:', e);
      return INITIAL_MEDICINES;
    }
  },
  async saveMedicines(medicines: Medicine[]): Promise<void> {
    await replaceAll('medicines', medicines.map(medicineToRow));
  },

  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error || !data) return INITIAL_CATEGORIES;
      return data.map(rowToCategory);
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  async saveCategories(categories: Category[]): Promise<void> {
    await replaceAll('categories', categories.map(categoryToRow));
  },

  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error || !data) return INITIAL_SUPPLIERS;
      return data.map(rowToSupplier);
    } catch {
      return INITIAL_SUPPLIERS;
    }
  },
  async saveSuppliers(suppliers: Supplier[]): Promise<void> {
    await replaceAll('suppliers', suppliers.map(supplierToRow));
  },

  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (error || !data) return INITIAL_CUSTOMERS;
      return data.map(rowToCustomer);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },
  async saveCustomers(customers: Customer[]): Promise<void> {
    await replaceAll('customers', customers.map(customerToRow));
  },

  async getSales(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase.from('sales').select('*');
      if (error || !data) return INITIAL_SALES;
      return data.map(rowToSale);
    } catch (e) {
      console.error('Error loading sales:', e);
      return INITIAL_SALES;
    }
  },
  async saveSales(sales: Sale[]): Promise<void> {
    await replaceAll('sales', sales.map(saleToRow));
  },

  async getPurchases(): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase.from('purchase_orders').select('*');
      if (error || !data) return INITIAL_PURCHASE_ORDERS;
      return data.map(rowToPO);
    } catch (e) {
      console.error('Error loading purchase orders:', e);
      return INITIAL_PURCHASE_ORDERS;
    }
  },
  async savePurchases(purchases: PurchaseOrder[]): Promise<void> {
    await replaceAll('purchase_orders', purchases.map(poToRow));
  },

  async getNotifications(): Promise<PharmacyNotification[]> {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
      if (error || !data) return INITIAL_NOTIFICATIONS;
      return data.map(rowToNotification);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },
  async saveNotifications(notifications: PharmacyNotification[]): Promise<void> {
    await replaceAll('notifications', notifications.map(notificationToRow));
  },

  async getSettings(): Promise<PharmacySettings> {
    try {
      const { data, error } = await supabase.from('settings').select('data').eq('id', 1).single();
      if (error || !data) return INITIAL_SETTINGS;
      return data.data as PharmacySettings;
    } catch {
      return INITIAL_SETTINGS;
    }
  },
  async saveSettings(settings: PharmacySettings): Promise<void> {
    const { error } = await supabase.from('settings').upsert({ id: 1, data: settings });
    if (error) console.error('Error saving settings:', error);
  },

  async getGenerics(): Promise<GenericSuggestion[]> {
    try {
      const { data, error } = await supabase.from('generic_suggestions').select('*');
      if (error || !data) return INITIAL_GENERIC_SUGGESTIONS;
      return data.map(rowToGeneric);
    } catch {
      return INITIAL_GENERIC_SUGGESTIONS;
    }
  },
  async saveGenerics(generics: GenericSuggestion[]): Promise<void> {
    await replaceAll('generic_suggestions', generics.map(genericToRow));
  }
};
