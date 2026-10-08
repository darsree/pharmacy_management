// MediCore - TypeScript Type Definitions

export type StockStatus = 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock';
export type BatchExpiryStatus = 'healthy' | 'expiring_60' | 'expiring_30' | 'expiring_7' | 'expired';
export type DosageForm = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Cream' | 'Ointment' | 'Inhaler' | 'Drops' | 'Powder';
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Batch {
  id: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  initialQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  status: BatchExpiryStatus;
  clearanceDiscount?: number;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  dosageForm: DosageForm;
  strength: string;
  prescriptionRequired: boolean;
  unitPrice: number; // Purchase price avg
  sellingPrice: number;
  stock: number;
  reorderThreshold: number;
  maxStock: number;
  supplierId: string;
  supplierName: string;
  description: string;
  sideEffects?: string;
  contraindications?: string;
  locationRack?: string;
  batches: Batch[];
  status: StockStatus;
  unitsSoldTotal?: number;
  revenueTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  medicineCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  openPurchaseOrders: number;
  onTimeDeliveryRate: number; // percentage e.g. 96
  status: 'active' | 'inactive' | 'preferred';
  rating: number; // 1-5
  paymentTerms: string;
}
export interface SupplierOffering {
  id: string;
  supplierId: string;
  supplierName: string;

  medicineId: string;
  medicineName: string;

  unitPurchasePrice: number;
  minOrderQuantity: number;
  leadTimeDays: number;

  availability:
    | 'in_stock'
    | 'limited'
    | 'out_of_stock';

  lastUpdated: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;

  latitude: number;
  longitude: number;

  rating: number;

  open24Hours: boolean;

  deliveryAvailable: boolean;
  deliveryFee: number;

  status: 'active' | 'inactive';
}

export interface PharmacyInventoryOffer {
  id: string;

  pharmacyId: string;

  medicineKey: string;

  medicineName: string;
  genericName: string;
  strength: string;
  dosageForm: string;

  price: number;
  stock: number;

  prescriptionRequired: boolean;

  lastUpdated: string;
}

export interface SupplierRecommendation {
  supplier: Supplier;
  offering: SupplierOffering;

  score: number;
  estimatedCost: number;

  reasons: string[];
}

export interface PharmacyRecommendation {
  pharmacy: Pharmacy;
  offer: PharmacyInventoryOffer;

  score: number;

  distanceKm?: number;

  reasons: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastPurchaseDate: string;
  tier: 'VIP' | 'Regular';
  allergies: string[];
  chronicConditions: string[];
  frequentMedicines: string[];
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // Amount or percentage
  tax: number; // GST
  total: number;
  paymentMethod: 'UPI' | 'Cash' | 'Card';
  status: 'paid' | 'pending' | 'refunded';
  pharmacistName: string;
  notes?: string;
}

export interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  receivedQuantity?: number;
  purchasePrice: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderedDate: string;
  expectedDeliveryDate: string;
  receivedDate?: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  notes?: string;
}

export interface PrescriptionMedicineItem {
  medicineId?: string;
  medicineName: string;
  genericName?: string;
  dosage: string; // e.g. "1 tablet"
  frequency: string; // e.g. "3 times/day"
  duration: string; // e.g. "5 days"
  instructions?: string; // e.g. "After meals"
}

export interface DrugInteractionAlert {
  severity: 'critical' | 'high' | 'moderate' | 'low';
  drugs: string[];
  issue: string;
  mechanism: string;
  recommendation: string;
}

export interface DuplicateTherapyAlert {
  severity: 'high' | 'moderate';
  drugs: string[];
  therapeuticClass: string;
  recommendation: string;
}

export interface DosageCheckAlert {
  medicine: string;
  prescribedDose: string;
  standardDose: string;
  status: 'normal' | 'high' | 'low' | 'frequency_warning';
  recommendation: string;
}

export interface AllergyWarningAlert {
  medicine: string;
  allergy: string;
  severity: 'critical' | 'warning';
  recommendation: string;
}

export interface GenericAlternativeAlert {
  prescribed: string;
  genericAlternative: string;
  activeMolecule: string;
  savingsPercent: number;
  availability: 'In Stock' | 'Low Stock' | 'Order Needed';
  inventoryStock: number;
}

export interface PrescriptionValidationResult {
  prescriptionId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorName: string;
  doctorRegNo: string;
  overallStatus: 'valid' | 'needs_review' | 'critical_warning';
  drugInteractions: DrugInteractionAlert[];
  duplicateTherapies: DuplicateTherapyAlert[];
  dosageChecks: DosageCheckAlert[];
  allergyWarnings: AllergyWarningAlert[];
  genericAlternatives: GenericAlternativeAlert[];
  pharmacistAdvice: string;
  timestamp: string;
}

export interface GenericSuggestion {
  id: string;
  brandMedicine: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  possibleGeneric: string;
  brandPrice: number;
  genericPrice: number;
  savingsPercent: number;
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock';
  inventoryStock: number;
  reason: string;
  manufacturer: string;
}

export interface DemandForecast {
  medicineId: string;
  medicineName: string;
  category: string;
  currentStock: number;
  avgDailySales: number;
  forecastPeriodDays: number;
  predictedDemand: number;
  projectedStockDays: number;
  stockoutRisk: 'critical' | 'high' | 'medium' | 'low';
  recommendedReorder: number;
  safetyBufferUnits: number;
  confidenceScore: number; // e.g. 94%
  aiExplanation: string;
  chartData: Array<{
    date: string;
    historicalSales?: number;
    predictedDemand?: number;
  }>;
}

export interface ReorderRecommendation {
  medicineId: string;
  medicineName: string;
  category: string;
  currentStock: number;
  avgDailyDemand: number;
  daysRemaining: number;
  recommendedQuantity: number;
  priority: PriorityLevel;
  reason: string;
  supplierId: string;
  supplierName: string;
  estimatedCost: number;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  category: 'stockout' | 'expiry' | 'demand' | 'supplier' | 'safety' | 'profit';
  medicineId?: string;
  medicineName?: string;
  recommendedAction: string;
  actionType: 'reorder' | 'view_inventory' | 'clearance' | 'review' | 'supplier' | 'forecast';
  actionPayload?: any;
  timestamp: string;
  isDismissed: boolean;
}

export interface PharmacyNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'critical_stock' | 'expiry' | 'supplier' | 'purchase_order' | 'prescription' | 'ai_insight' | 'sale';
  priority: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  linkRoute?: string;
  relatedEntityId?: string;
}

export interface PharmacySettings {
  profile: {
    name: string;
    role: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  business: {
    pharmacyName: string;
    licenseNumber: string;
    gstNumber: string;
    address: string;
    phone: string;
    currency: string;
    currencySymbol: string;
    lowStockThresholdDefault: number;
    nearExpiryDaysDefault: number;
  };
  notifications: {
    lowStockAlerts: boolean;
    expiryAlerts: boolean;
    supplierReminders: boolean;
    dailySalesSummary: boolean;
    aiRecommendations: boolean;
  };
  aiPreferences: {
    enableAiInsights: boolean;
    enableDemandForecast: boolean;
    enableGenericSuggestions: boolean;
    enablePrescriptionValidation: boolean;
    confidenceThreshold: number;
  };
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionButtons?: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
  dataCard?: {
    title: string;
    items: Array<{ label: string; value: string | number; badge?: string }>;
  };
}
