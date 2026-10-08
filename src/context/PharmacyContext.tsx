// MediCore - Global Pharmacy React Context & Provider

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Medicine,
  Batch,
  Category,
  Supplier,
  Customer,
  Sale,
  PurchaseOrder,
  PharmacyNotification,
  PharmacySettings,
  AIInsight,
  GenericSuggestion,
  SaleItem,
  PurchaseItem
} from '../types';
import { storageService } from '../services/storageService';
import { INITIAL_SETTINGS } from '../data/mockData';
import { generateLiveInsights } from '../services/aiService';
import { computeStockStatus, allocateBatchesExpiryFirst, generateId, getBatchExpiryStatus } from '../utils';

export type PageRoute =
  | 'dashboard'
  | 'medicines'
  | 'inventory'
  | 'categories'
  | 'ai-insights'
  | 'prescriptions'
  | 'generics'
  | 'suppliers'
  | 'customers'
  | 'sales'
  | 'purchases'
  | 'reports'
  | 'forecast'
  | 'notifications'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface PharmacyContextType {
  activePage: PageRoute;
  setActivePage: (page: PageRoute) => void;
  
  // Data entities
  medicines: Medicine[];
  allBatches: Batch[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  notifications: PharmacyNotification[];
  insights: AIInsight[];
  settings: PharmacySettings;
  generics: GenericSuggestion[];
  
  // KPIs & Metrics
  totalRevenue: number;
  todaySalesRevenue: number;
  totalMedicinesCount: number;
  totalInventoryUnits: number;
  lowStockMedicinesCount: number;
  expiringSoonBatchesCount: number;
  outOfStockMedicinesCount: number;
  pendingPurchaseOrdersCount: number;
  unreadNotificationsCount: number;
  
  // Modals & UI States
  isNewSaleOpen: boolean;
  setIsNewSaleOpen: (open: boolean) => void;
  isAddMedicineOpen: boolean;
  setIsAddMedicineOpen: (open: boolean) => void;
  isCreatePOOpen: boolean;
  setIsCreatePOOpen: (open: boolean) => void;
  // Set by an AI Insight's "Reorder" action right before opening the PO
  // modal, so the modal can pre-fill the SPECIFIC medicine that was clicked
  // instead of defaulting to the first low-stock item in the catalog.
  pendingReorder: { medicineId: string; quantity: number; supplierId?: string } | null;
  setPendingReorder: (payload: { medicineId: string; quantity: number; supplierId?: string } | null) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  selectedMedicineIdForDetails: string | null;
  setSelectedMedicineIdForDetails: (id: string | null) => void;
  selectedPOForReceiving: PurchaseOrder | null;
  setSelectedPOForReceiving: (po: PurchaseOrder | null) => void;

  // Actions
  addMedicine: (med: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'batches' | 'status'>, initialBatch?: Partial<Batch>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  
  addBatch: (medicineId: string, batchData: Omit<Batch, 'id' | 'medicineId' | 'medicineName' | 'status'>) => void;
  updateBatch: (batchId: string, updates: Partial<Batch>) => void;
  deleteBatch: (medicineId: string, batchId: string) => void;
  
  completeSale: (saleData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ medicineId: string; quantity: number }>;
    paymentMethod: 'UPI' | 'Cash' | 'Card';
    discountPercentage?: number;
    notes?: string;
  }) => { success: boolean; invoiceId?: string; errorMessage?: string };

  createPurchaseOrder: (poData: {
    supplierId: string;
    items: Array<{ medicineId: string; quantity: number; purchasePrice: number }>;
    expectedDeliveryDate: string;
    notes?: string;
  }) => string;

  receivePurchaseOrder: (
    poId: string,
    receivedItems: Array<{ medicineId: string; quantity: number; batchNumber: string; expiryDate: string }>
  ) => void;

  cancelPurchaseOrder: (poId: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'ordersCount' | 'totalSpent' | 'lastPurchaseDate'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'medicineCount'>) => void;
  deleteCategory: (id: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  dismissInsight: (id: string) => void;

  updateSettings: (newSettings: PharmacySettings) => void;
  resetToDemoData: () => void;
  
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Guards the autosave effects below from firing (and wiping the DB with
  // empty arrays) before the initial async load from Supabase has finished.
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const [activePage, setActivePage] = useState<PageRoute>('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [notifications, setNotifications] = useState<PharmacyNotification[]>([]);
  const [settings, setSettings] = useState<PharmacySettings>(INITIAL_SETTINGS);
  const [generics, setGenerics] = useState<GenericSuggestion[]>([]);

  // Load everything from Supabase once on mount (seeding the DB first if empty)
  useEffect(() => {
    (async () => {
      await storageService.initializeData();
      const [
        loadedMedicines,
        loadedCategories,
        loadedSuppliers,
        loadedCustomers,
        loadedSales,
        loadedPurchases,
        loadedNotifications,
        loadedSettings,
        loadedGenerics
      ] = await Promise.all([
        storageService.getMedicines(),
        storageService.getCategories(),
        storageService.getSuppliers(),
        storageService.getCustomers(),
        storageService.getSales(),
        storageService.getPurchases(),
        storageService.getNotifications(),
        storageService.getSettings(),
        storageService.getGenerics()
      ]);
      setMedicines(loadedMedicines);
      setCategories(loadedCategories);
      setSuppliers(loadedSuppliers);
      setCustomers(loadedCustomers);
      setSales(loadedSales);
      setPurchaseOrders(loadedPurchases);
      setNotifications(loadedNotifications);
      setSettings(loadedSettings);
      setGenerics(loadedGenerics);
      setIsDataLoaded(true);
    })();
  }, []);

  // UI States
  const [isNewSaleOpen, setIsNewSaleOpen] = useState<boolean>(false);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState<boolean>(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState<boolean>(false);
  const [pendingReorder, setPendingReorder] = useState<{ medicineId: string; quantity: number; supplierId?: string } | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedPOForReceiving, setSelectedPOForReceiving] = useState<PurchaseOrder | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [selectedMedicineIdForDetails, setSelectedMedicineIdForDetails] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = generateId('toast');
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sync to Storage when state changes.
  // Every effect is guarded by isDataLoaded so we never fire a save with the
  // empty initial arrays before the first load from Supabase completes.
  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveMedicines(medicines);
  }, [medicines, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveCategories(categories);
  }, [categories, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveSuppliers(suppliers);
  }, [suppliers, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveCustomers(customers);
  }, [customers, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveSales(sales);
  }, [sales, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.savePurchases(purchaseOrders);
  }, [purchaseOrders, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveNotifications(notifications);
  }, [notifications, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    storageService.saveSettings(settings);
  }, [settings, isDataLoaded]);

  // Derived: All Batches flat list
  const allBatches = useMemo(() => {
    return medicines.flatMap(m => m.batches || []);
  }, [medicines]);

  // Derived: AI Live Insights
  const insights = useMemo(() => {
    return generateLiveInsights(medicines, sales, purchaseOrders);
  }, [medicines, sales, purchaseOrders]);

  // Derived KPIs
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.status === 'paid' ? s.total : 0), 0);
  }, [sales]);

  const todaySalesRevenue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sales
      .filter(s => s.status === 'paid' && s.date.startsWith(today))
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const totalMedicinesCount = medicines.length;

  const totalInventoryUnits = useMemo(() => {
    return medicines.reduce((sum, m) => sum + m.stock, 0);
  }, [medicines]);

  const lowStockMedicinesCount = useMemo(() => {
    return medicines.filter(m => m.status === 'low_stock' || m.status === 'critical').length;
  }, [medicines]);

  const expiringSoonBatchesCount = useMemo(() => {
    return allBatches.filter(
      b => b.quantity > 0 && (b.status === 'expiring_7' || b.status === 'expiring_30' || b.status === 'expiring_60')
    ).length;
  }, [allBatches]);

  const outOfStockMedicinesCount = useMemo(() => {
    return medicines.filter(m => m.status === 'out_of_stock').length;
  }, [medicines]);

  const pendingPurchaseOrdersCount = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'pending' || po.status === 'confirmed').length;
  }, [purchaseOrders]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Actions: Medicines
  const addMedicine = useCallback((
    medData: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'batches' | 'status'>,
    initialBatch?: Partial<Batch>
  ) => {
    const newId = generateId('med');
    const now = new Date().toISOString().slice(0, 10);
    const initialBatches: Batch[] = [];
    let initialStock = medData.stock || 0;

    if (initialBatch && initialBatch.batchNumber) {
      const batchId = generateId('bat');
      const bQty = initialBatch.quantity || initialStock || 50;
      initialStock = bQty;
      const expStatus = getBatchExpiryStatus(initialBatch.expiryDate || '2027-12-31');

      initialBatches.push({
        id: batchId,
        batchNumber: initialBatch.batchNumber,
        medicineId: newId,
        medicineName: medData.name,
        manufacturingDate: initialBatch.manufacturingDate || now,
        expiryDate: initialBatch.expiryDate || '2027-12-31',
        quantity: bQty,
        initialQuantity: bQty,
        purchasePrice: initialBatch.purchasePrice || medData.unitPrice,
        sellingPrice: initialBatch.sellingPrice || medData.sellingPrice,
        supplierId: medData.supplierId,
        supplierName: medData.supplierName,
        receivedDate: now,
        status: expStatus
      });
    }

    const computedStatus = computeStockStatus(initialStock, medData.reorderThreshold);

    const newMedicine: Medicine = {
      ...medData,
      id: newId,
      stock: initialStock,
      status: computedStatus,
      batches: initialBatches,
      unitsSoldTotal: 0,
      revenueTotal: 0,
      createdAt: now,
      updatedAt: now
    };

    setMedicines(prev => [newMedicine, ...prev]);

    // Update category medicine count
    setCategories(prev =>
      prev.map(c => (c.name === medData.category ? { ...c, medicineCount: c.medicineCount + 1 } : c))
    );

    addToast('success', 'Medicine Added', `${medData.name} has been added to the catalog.`);
  }, [addToast]);

  const updateMedicine = useCallback((id: string, updates: Partial<Medicine>) => {
    setMedicines(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates, updatedAt: new Date().toISOString().slice(0, 10) };
        if (updates.stock !== undefined || updates.reorderThreshold !== undefined) {
          updated.status = computeStockStatus(updated.stock, updated.reorderThreshold);
        }
        return updated;
      })
    );
    addToast('success', 'Medicine Updated', 'Medicine details saved successfully.');
  }, [addToast]);

  const deleteMedicine = useCallback((id: string) => {
    const med = medicines.find(m => m.id === id);
    setMedicines(prev => prev.filter(m => m.id !== id));
    if (med) {
      setCategories(prev =>
        prev.map(c => (c.name === med.category ? { ...c, medicineCount: Math.max(0, c.medicineCount - 1) } : c))
      );
    }
    addToast('info', 'Medicine Deleted', `${med?.name || 'Medicine'} was removed from catalog.`);
  }, [medicines, addToast]);

  // Actions: Batches
  const addBatch = useCallback((
    medicineId: string,
    batchData: Omit<Batch, 'id' | 'medicineId' | 'medicineName' | 'status'>
  ) => {
    const batchId = generateId('bat');
    const expStatus = getBatchExpiryStatus(batchData.expiryDate);

    setMedicines(prev =>
      prev.map(m => {
        if (m.id !== medicineId) return m;
        const newBatch: Batch = {
          ...batchData,
          id: batchId,
          medicineId: m.id,
          medicineName: m.name,
          status: expStatus
        };
        const newBatches = [...m.batches, newBatch];
        const newStock = newBatches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          ...m,
          batches: newBatches,
          stock: newStock,
          status: computeStockStatus(newStock, m.reorderThreshold),
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      })
    );

    addToast('success', 'Batch Added', `Batch ${batchData.batchNumber} recorded successfully.`);
  }, [addToast]);

  const updateBatch = useCallback((batchId: string, updates: Partial<Batch>) => {
    setMedicines(prev =>
      prev.map(m => {
        const hasBatch = m.batches.some(b => b.id === batchId);
        if (!hasBatch) return m;

        const newBatches = m.batches.map(b => {
          if (b.id !== batchId) return b;
          const updated = { ...b, ...updates };
          if (updates.expiryDate) {
            updated.status = getBatchExpiryStatus(updated.expiryDate);
          }
          return updated;
        });

        const newStock = newBatches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          ...m,
          batches: newBatches,
          stock: newStock,
          status: computeStockStatus(newStock, m.reorderThreshold),
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      })
    );
    addToast('success', 'Batch Updated', 'Batch quantity and details updated.');
  }, [addToast]);

  const deleteBatch = useCallback((medicineId: string, batchId: string) => {
    setMedicines(prev =>
      prev.map(m => {
        if (m.id !== medicineId) return m;
        const newBatches = m.batches.filter(b => b.id !== batchId);
        const newStock = newBatches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          ...m,
          batches: newBatches,
          stock: newStock,
          status: computeStockStatus(newStock, m.reorderThreshold),
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      })
    );
    addToast('info', 'Batch Removed', 'Batch removed from inventory.');
  }, [addToast]);

  // Actions: POS & Sales with Earliest-Expiry (FIFO) Allocation
  const completeSale = useCallback((saleData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ medicineId: string; quantity: number }>;
    paymentMethod: 'UPI' | 'Cash' | 'Card';
    discountPercentage?: number;
    notes?: string;
  }) => {
    const saleItems: SaleItem[] = [];
    let subtotal = 0;
    const medicineDeductions: Array<{ medicineId: string; batchId: string; quantity: number }> = [];

    // 1. Verify stock & earliest-expiry allocation for each requested item
    for (const reqItem of saleData.items) {
      const medicine = medicines.find(m => m.id === reqItem.medicineId);
      if (!medicine) {
        return { success: false, errorMessage: `Medicine not found in catalog.` };
      }

      const allocResult = allocateBatchesExpiryFirst(medicine, reqItem.quantity);
      if (!allocResult.success) {
        return { success: false, errorMessage: allocResult.errorMessage };
      }

      for (const alloc of allocResult.allocations) {
        saleItems.push({
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          batchId: alloc.batch.id,
          batchNumber: alloc.batch.batchNumber,
          expiryDate: alloc.batch.expiryDate,
          quantity: alloc.allocatedQty,
          unitPrice: alloc.unitPrice,
          total: alloc.subtotal
        });

        subtotal += alloc.subtotal;
        medicineDeductions.push({
          medicineId: medicine.id,
          batchId: alloc.batch.id,
          quantity: alloc.allocatedQty
        });
      }
    }

    // 2. Compute Discounts & GST
    const discountPct = saleData.discountPercentage || 0;
    const discountAmount = (subtotal * discountPct) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * 0.05; // 5% GST standard for formulations
    const grandTotal = taxableAmount + taxAmount;

    const invoiceId = generateId('sale');
    const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSale: Sale = {
      id: invoiceId,
      invoiceNumber,
      customerId: saleData.customerId || 'walkin',
      customerName: saleData.customerName || 'Walk-in Customer',
      customerPhone: saleData.customerPhone || 'N/A',
      date: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod: saleData.paymentMethod,
      status: 'paid',
      pharmacistName: settings.profile.name,
      notes: saleData.notes
    };

    // 3. Atomically deduct inventory batches & update medicine stock
    setMedicines(prev =>
      prev.map(med => {
        const relevantDeductions = medicineDeductions.filter(d => d.medicineId === med.id);
        if (!relevantDeductions.length) return med;

        const updatedBatches = med.batches.map(batch => {
          const deduction = relevantDeductions.find(d => d.batchId === batch.id);
          if (!deduction) return batch;
          const remainingQty = Math.max(0, batch.quantity - deduction.quantity);
          return {
            ...batch,
            quantity: remainingQty
          };
        });

        const totalDeductedUnits = relevantDeductions.reduce((sum, d) => sum + d.quantity, 0);
        const newStock = Math.max(0, med.stock - totalDeductedUnits);
        const newStatus = computeStockStatus(newStock, med.reorderThreshold);

        return {
          ...med,
          stock: newStock,
          status: newStatus,
          batches: updatedBatches,
          unitsSoldTotal: (med.unitsSoldTotal || 0) + totalDeductedUnits,
          revenueTotal: (med.revenueTotal || 0) + (totalDeductedUnits * med.sellingPrice),
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      })
    );

    // 4. Update sales records
    setSales(prev => [newSale, ...prev]);

    // 5. Update customer lifetime spending
    if (saleData.customerId && saleData.customerId !== 'walkin') {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id !== saleData.customerId) return c;
          return {
            ...c,
            ordersCount: c.ordersCount + 1,
            totalSpent: c.totalSpent + grandTotal,
            lastPurchaseDate: new Date().toISOString().slice(0, 10)
          };
        })
      );
    }

    addToast('success', 'Sale Completed', `Invoice ${invoiceNumber} created. Total: ₹${grandTotal.toFixed(2)}`);
    return { success: true, invoiceId };
  }, [medicines, settings, addToast]);

  // Actions: Purchase Orders
  const createPurchaseOrder = useCallback((poData: {
    supplierId: string;
    items: Array<{ medicineId: string; quantity: number; purchasePrice: number }>;
    expectedDeliveryDate: string;
    notes?: string;
  }) => {
    const supplier = suppliers.find(s => s.id === poData.supplierId);
    const poId = generateId('po');
    const poNumber = `PO-${Math.floor(4000 + Math.random() * 1000)}`;

    const poItems: PurchaseItem[] = poData.items.map(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      return {
        medicineId: item.medicineId,
        medicineName: med?.name || 'Medicine',
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        total: item.quantity * item.purchasePrice
      };
    });

    const subtotal = poItems.reduce((acc, i) => acc + i.total, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const newPO: PurchaseOrder = {
      id: poId,
      poNumber,
      supplierId: poData.supplierId,
      supplierName: supplier?.name || 'Supplier',
      orderedDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: poData.expectedDeliveryDate,
      items: poItems,
      subtotal,
      tax,
      total,
      status: 'pending',
      notes: poData.notes
    };

    setPurchaseOrders(prev => [newPO, ...prev]);

    // Update supplier open orders count
    setSuppliers(prev =>
      prev.map(s => (s.id === poData.supplierId ? { ...s, openPurchaseOrders: s.openPurchaseOrders + 1 } : s))
    );

    addToast('success', 'Purchase Order Created', `${poNumber} sent to ${supplier?.name}.`);
    return poId;
  }, [suppliers, medicines, addToast]);

  const receivePurchaseOrder = useCallback((
    poId: string,
    receivedBatches: Array<{ medicineId: string; quantity: number; batchNumber: string; expiryDate: string }>
  ) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const now = new Date().toISOString().slice(0, 10);

    // Update inventory with received batches
    setMedicines(prev =>
      prev.map(med => {
        const itemReceived = receivedBatches.find(r => r.medicineId === med.id);
        if (!itemReceived) return med;

        const newBatch: Batch = {
          id: generateId('bat'),
          batchNumber: itemReceived.batchNumber || `B-${Math.floor(1000 + Math.random() * 9000)}`,
          medicineId: med.id,
          medicineName: med.name,
          manufacturingDate: now,
          expiryDate: itemReceived.expiryDate || '2028-06-30',
          quantity: itemReceived.quantity,
          initialQuantity: itemReceived.quantity,
          purchasePrice: med.unitPrice,
          sellingPrice: med.sellingPrice,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          receivedDate: now,
          status: getBatchExpiryStatus(itemReceived.expiryDate || '2028-06-30')
        };

        const updatedBatches = [...med.batches, newBatch];
        const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

        return {
          ...med,
          batches: updatedBatches,
          stock: newStock,
          status: computeStockStatus(newStock, med.reorderThreshold),
          updatedAt: now
        };
      })
    );

    // Mark PO as received
    setPurchaseOrders(prev =>
      prev.map(p => {
        if (p.id !== poId) return p;
        return {
          ...p,
          status: 'received',
          receivedDate: now
        };
      })
    );

    // Update supplier open orders
    setSuppliers(prev =>
      prev.map(s => (s.id === po.supplierId ? { ...s, openPurchaseOrders: Math.max(0, s.openPurchaseOrders - 1) } : s))
    );

    addToast('success', 'Stock Received', `Purchase Order ${po.poNumber} received. Inventory updated successfully.`);
  }, [purchaseOrders, addToast]);

  const cancelPurchaseOrder = useCallback((poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    setPurchaseOrders(prev =>
      prev.map(p => (p.id === poId ? { ...p, status: 'cancelled' } : p))
    );
    if (po) {
      setSuppliers(prev =>
        prev.map(s => (s.id === po.supplierId ? { ...s, openPurchaseOrders: Math.max(0, s.openPurchaseOrders - 1) } : s))
      );
    }
    addToast('info', 'PO Cancelled', `Purchase order ${po?.poNumber || ''} has been cancelled.`);
  }, [purchaseOrders, addToast]);

  // Actions: Suppliers & Customers & Categories
  const addSupplier = useCallback((sup: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...sup, id: generateId('sup') };
    setSuppliers(prev => [newSup, ...prev]);
    addToast('success', 'Supplier Added', `${sup.name} added to suppliers directory.`);
  }, [addToast]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    addToast('success', 'Supplier Updated', 'Supplier record saved.');
  }, [addToast]);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addToast('info', 'Supplier Deleted', 'Supplier removed.');
  }, [addToast]);

  const addCustomer = useCallback((cust: Omit<Customer, 'id' | 'ordersCount' | 'totalSpent' | 'lastPurchaseDate'>) => {
    const newCust: Customer = {
      ...cust,
      id: generateId('cust'),
      ordersCount: 0,
      totalSpent: 0,
      lastPurchaseDate: 'Never'
    };
    setCustomers(prev => [newCust, ...prev]);
    addToast('success', 'Customer Added', `${cust.name} added to customer records.`);
  }, [addToast]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    addToast('success', 'Customer Updated', 'Customer profile updated.');
  }, [addToast]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    addToast('info', 'Customer Deleted', 'Customer removed.');
  }, [addToast]);

  const addCategory = useCallback((cat: Omit<Category, 'id' | 'medicineCount'>) => {
    const newCat: Category = { ...cat, id: generateId('cat'), medicineCount: 0 };
    setCategories(prev => [...prev, newCat]);
    addToast('success', 'Category Created', `Category ${cat.name} added.`);
  }, [addToast]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    addToast('info', 'Category Removed', 'Category removed.');
  }, [addToast]);

  // Actions: Notifications & Insights
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast('info', 'Notifications', 'All notifications marked as read.');
  }, [addToast]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissInsight = useCallback((id: string) => {
    addToast('info', 'Insight Dismissed', 'Recommendation dismissed.');
  }, [addToast]);

  // Actions: Settings & Reset
  const updateSettings = useCallback((newSettings: PharmacySettings) => {
    setSettings(newSettings);
    addToast('success', 'Settings Saved', 'Pharmacy preferences and configurations updated.');
  }, [addToast]);

  const resetToDemoData = useCallback(() => {
    (async () => {
      setIsDataLoaded(false); // pause autosave while we bulk-overwrite the DB
      await storageService.resetAllToDefault();
      setMedicines(await storageService.getMedicines());
      setCategories(await storageService.getCategories());
      setSuppliers(await storageService.getSuppliers());
      setCustomers(await storageService.getCustomers());
      setSales(await storageService.getSales());
      setPurchaseOrders(await storageService.getPurchases());
      setNotifications(await storageService.getNotifications());
      setSettings(await storageService.getSettings());
      setGenerics(await storageService.getGenerics());
      setIsDataLoaded(true);
      addToast('success', 'Demo Reset', 'Application state has been restored to default demo data.');
    })();
  }, [addToast]);

  const value = {
    activePage,
    setActivePage,
    medicines,
    allBatches,
    categories,
    suppliers,
    customers,
    sales,
    purchaseOrders,
    notifications,
    insights,
    settings,
    generics,
    totalRevenue,
    todaySalesRevenue,
    totalMedicinesCount,
    totalInventoryUnits,
    lowStockMedicinesCount,
    expiringSoonBatchesCount,
    outOfStockMedicinesCount,
    pendingPurchaseOrdersCount,
    unreadNotificationsCount,
    isNewSaleOpen,
    setIsNewSaleOpen,
    isAddMedicineOpen,
    setIsAddMedicineOpen,
    isCreatePOOpen,
    setIsCreatePOOpen,
    pendingReorder,
    setPendingReorder,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    isSearchOpen,
    setIsSearchOpen,
    selectedPOForReceiving,
    setSelectedPOForReceiving,
    globalSearchQuery,
    setGlobalSearchQuery,
    selectedMedicineIdForDetails,
    setSelectedMedicineIdForDetails,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addBatch,
    updateBatch,
    deleteBatch,
    completeSale,
    createPurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCategory,
    deleteCategory,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    dismissInsight,
    updateSettings,
    resetToDemoData,
    toasts,
    addToast,
    removeToast
  };

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
};

export const usePharmacy = (): PharmacyContextType => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
