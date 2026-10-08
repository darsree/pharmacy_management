import {
  Pharmacy,
  PharmacyInventoryOffer,
  SupplierOffering
} from '../types';

import {
  INITIAL_MEDICINES,
  INITIAL_SUPPLIERS
} from './mockData';

const supplierMultipliers: Record<
  string,
  number
> = {
  'sup-1': 1.0,
  'sup-2': 1.04,
  'sup-3': 0.97,
  'sup-4': 1.02
};

const leadTimes: Record<string, number> = {
  'sup-1': 2,
  'sup-2': 3,
  'sup-3': 5,
  'sup-4': 2
};

const availabilityBySupplier = (
  supplierId: string,
  medicineIndex: number
): SupplierOffering['availability'] => {
  if (
    supplierId === 'sup-3' &&
    medicineIndex % 5 === 0
  ) {
    return 'limited';
  }

  if (
    supplierId === 'sup-2' &&
    medicineIndex % 7 === 0
  ) {
    return 'limited';
  }

  if (
    supplierId === 'sup-4' &&
    medicineIndex % 6 === 0
  ) {
    return 'out_of_stock';
  }

  return 'in_stock';
};

export const INITIAL_SUPPLIER_OFFERINGS: SupplierOffering[] =
  INITIAL_MEDICINES.flatMap(
    (medicine, medicineIndex) =>
      INITIAL_SUPPLIERS.map((supplier) => ({
        id: `offer-${supplier.id}-${medicine.id}`,

        supplierId: supplier.id,

        supplierName: supplier.name,

        medicineId: medicine.id,

        medicineName: medicine.name,

        unitPurchasePrice: Number(
          (
            medicine.unitPrice *
            (supplierMultipliers[
              supplier.id
            ] ?? 1)
          ).toFixed(2)
        ),

        minOrderQuantity: Math.max(
          10,
          Math.ceil(
            (medicine.reorderThreshold ||
              10) *
              0.1
          )
        ),

        leadTimeDays:
          leadTimes[supplier.id] ?? 4,

        availability:
          availabilityBySupplier(
            supplier.id,
            medicineIndex
          ),

        lastUpdated:
          new Date().toISOString()
      }))
  );

export const INITIAL_PHARMACIES: Pharmacy[] = [
  {
    id: 'ph-1',
    name: 'MediCore Central Pharmacy',
    address:
      '100ft Road, Indiranagar, Bengaluru, KA 560038',
    phone: '+91 80 4123 9988',
    latitude: 12.9719,
    longitude: 77.6412,
    rating: 4.8,
    open24Hours: true,
    deliveryAvailable: true,
    deliveryFee: 25,
    status: 'active'
  },

  {
    id: 'ph-2',
    name: 'Apollo Care Pharmacy',
    address:
      '12th Main Road, Indiranagar, Bengaluru, KA 560038',
    phone: '+91 80 4567 1100',
    latitude: 12.9784,
    longitude: 77.6408,
    rating: 4.6,
    open24Hours: true,
    deliveryAvailable: true,
    deliveryFee: 30,
    status: 'active'
  },

  {
    id: 'ph-3',
    name: 'HealthFirst Pharmacy',
    address:
      '80ft Road, Koramangala, Bengaluru, KA 560034',
    phone: '+91 80 4012 7711',
    latitude: 12.9352,
    longitude: 77.6245,
    rating: 4.7,
    open24Hours: false,
    deliveryAvailable: true,
    deliveryFee: 20,
    status: 'active'
  },

  {
    id: 'ph-4',
    name: 'WellLife Medicals',
    address:
      'HSR Layout Sector 2, Bengaluru, KA 560102',
    phone: '+91 80 4098 2288',
    latitude: 12.9121,
    longitude: 77.6446,
    rating: 4.4,
    open24Hours: false,
    deliveryAvailable: true,
    deliveryFee: 15,
    status: 'active'
  },

  {
    id: 'ph-5',
    name: 'CarePlus Pharmacy',
    address:
      'Whitefield Main Road, Bengaluru, KA 560066',
    phone: '+91 80 4122 6611',
    latitude: 12.9698,
    longitude: 77.7499,
    rating: 4.5,
    open24Hours: true,
    deliveryAvailable: true,
    deliveryFee: 35,
    status: 'active'
  }
];

const pharmacyMultipliers = [
  1.0,
  0.96,
  1.03,
  0.94,
  1.01
];

export const INITIAL_PHARMACY_INVENTORY: PharmacyInventoryOffer[] =
  INITIAL_PHARMACIES.flatMap(
    (pharmacy, pharmacyIndex) =>
      INITIAL_MEDICINES.map(
        (medicine, medicineIndex) => ({
          id: `phi-${pharmacy.id}-${medicine.id}`,

          pharmacyId: pharmacy.id,

          medicineKey:
            `${medicine.genericName}|${medicine.strength}|${medicine.dosageForm}`.toLowerCase(),

          medicineName: medicine.name,

          genericName:
            medicine.genericName,

          strength: medicine.strength,

          dosageForm:
            medicine.dosageForm,

          price: Number(
            (
              medicine.sellingPrice *
              pharmacyMultipliers[
                pharmacyIndex
              ]
            ).toFixed(2)
          ),

          stock: Math.max(
            0,
            medicine.stock +
              pharmacyIndex * 19 -
              medicineIndex * 3
          ),

          prescriptionRequired:
            medicine.prescriptionRequired,

          lastUpdated:
            new Date().toISOString()
        })
      )
  );