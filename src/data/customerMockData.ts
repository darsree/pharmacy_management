// Hardcoded demo data for the signed-in CUSTOMER (Arjun Mehta).
// These are the customer's own purchases from pharmacies - not the pharmacy's
// stock purchase orders.

export interface CustomerPurchaseItem {
  medicineName: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerPurchase {
  id: string;
  orderNumber: string;
  date: string; // yyyy-mm-dd
  pharmacyName: string;
  items: CustomerPurchaseItem[];
  total: number;
  paymentMethod: 'UPI' | 'Cash' | 'Card';
  status: 'delivered' | 'picked_up' | 'processing';
  prescriptionVerified: boolean;
  notes?: string;
}

export const CUSTOMER_PHARMACIES = [
  'MediCore Central Pharmacy',
  'Apollo Care Pharmacy',
  'HealthFirst Pharmacy',
  'WellLife Medicals',
  'CarePlus Pharmacy'
];

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const total = (items: CustomerPurchaseItem[]) =>
  Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * 100) / 100;

const mk = (
  id: string,
  orderNumber: string,
  ago: number,
  pharmacyName: string,
  items: CustomerPurchaseItem[],
  paymentMethod: CustomerPurchase['paymentMethod'],
  status: CustomerPurchase['status'],
  prescriptionVerified: boolean,
  notes?: string
): CustomerPurchase => ({
  id,
  orderNumber,
  date: daysAgo(ago),
  pharmacyName,
  items,
  total: total(items),
  paymentMethod,
  status,
  prescriptionVerified,
  notes
});

export const INITIAL_CUSTOMER_PURCHASES: CustomerPurchase[] = [
  mk('cp-1', 'ORD-7421', 2, 'MediCore Central Pharmacy', [
    { medicineName: 'Metformin 500mg', quantity: 60, unitPrice: 2.4 },
    { medicineName: 'Atorvastatin 10mg', quantity: 30, unitPrice: 6.5 }
  ], 'UPI', 'picked_up', true, 'Monthly diabetes + cholesterol refill'),
  mk('cp-2', 'ORD-7388', 9, 'Apollo Care Pharmacy', [
    { medicineName: 'Paracetamol 650mg', quantity: 10, unitPrice: 2.8 },
    { medicineName: 'Cetirizine 10mg', quantity: 10, unitPrice: 2.1 }
  ], 'Cash', 'picked_up', false),
  mk('cp-3', 'ORD-7310', 18, 'MediCore Central Pharmacy', [
    { medicineName: 'Azithromycin 500mg', quantity: 3, unitPrice: 24 },
    { medicineName: 'Vitamin C 500mg', quantity: 15, unitPrice: 3.2 }
  ], 'UPI', 'delivered', true, 'Home delivery'),
  mk('cp-4', 'ORD-7254', 33, 'HealthFirst Pharmacy', [
    { medicineName: 'Metformin 500mg', quantity: 60, unitPrice: 2.6 },
    { medicineName: 'Atorvastatin 10mg', quantity: 30, unitPrice: 6.8 }
  ], 'Card', 'picked_up', true),
  mk('cp-5', 'ORD-7190', 47, 'WellLife Medicals', [
    { medicineName: 'Pantoprazole 40mg', quantity: 14, unitPrice: 5.5 },
    { medicineName: 'ORS Sachet', quantity: 6, unitPrice: 12 }
  ], 'UPI', 'delivered', false),
  mk('cp-6', 'ORD-7102', 63, 'MediCore Central Pharmacy', [
    { medicineName: 'Metformin 500mg', quantity: 60, unitPrice: 2.4 },
    { medicineName: 'Atorvastatin 10mg', quantity: 30, unitPrice: 6.5 },
    { medicineName: 'Aspirin 75mg', quantity: 30, unitPrice: 1.5 }
  ], 'UPI', 'picked_up', true),
  mk('cp-7', 'ORD-7044', 88, 'CarePlus Pharmacy', [
    { medicineName: 'Ibuprofen 400mg', quantity: 10, unitPrice: 3.1 },
    { medicineName: 'Multivitamin Tablets', quantity: 30, unitPrice: 4.2 }
  ], 'Cash', 'picked_up', false)
];

export const customerPurchaseTotal = total;
