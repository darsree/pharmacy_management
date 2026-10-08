import {
  Medicine,
  Pharmacy,
  PharmacyInventoryOffer,
  PharmacyRecommendation,
  Supplier,
  SupplierOffering,
  SupplierRecommendation
} from '../types';

export function medicineKey(
  genericName: string,
  strength: string,
  dosageForm: string
): string {
  return `${genericName}|${strength}|${dosageForm}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

/**
 * Recommend the best supplier for a medicine.
 *
 * Ranking factors:
 * - Purchase price: 30%
 * - On-time delivery: 25%
 * - Supplier rating: 20%
 * - Availability: 15%
 * - Lead time: 10%
 */
export function recommendSuppliers(
  medicine: Medicine,
  suppliers: Supplier[],
  offerings: SupplierOffering[],
  quantity: number
): SupplierRecommendation[] {
  const candidates = offerings
    .filter(
      (o) =>
        o.medicineId === medicine.id &&
        o.availability !== 'out_of_stock'
    )
    .map((offering) => {
      const supplier = suppliers.find(
        (s) => s.id === offering.supplierId
      );

      if (!supplier) return null;

      return {
        supplier,
        offering
      };
    })
    .filter(Boolean) as Array<{
      supplier: Supplier;
      offering: SupplierOffering;
    }>;

  if (!candidates.length) {
    return [];
  }

  const prices = candidates.map(
    (c) => c.offering.unitPurchasePrice
  );

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const maxLead = Math.max(
    ...candidates.map((c) => c.offering.leadTimeDays),
    1
  );

  return candidates
    .map(({ supplier, offering }) => {
      const priceScore =
        maxPrice === minPrice
          ? 100
          : 100 -
            ((offering.unitPurchasePrice - minPrice) /
              (maxPrice - minPrice)) *
              100;

      const availabilityScore =
        offering.availability === 'in_stock'
          ? 100
          : 60;

      const deliveryScore = clamp(
        supplier.onTimeDeliveryRate
      );

      const ratingScore = clamp(
        (supplier.rating / 5) * 100
      );

      const leadScore =
        100 -
        ((offering.leadTimeDays - 1) / maxLead) * 100;

      const score = Number(
        (
          priceScore * 0.30 +
          deliveryScore * 0.25 +
          ratingScore * 0.20 +
          availabilityScore * 0.15 +
          leadScore * 0.10
        ).toFixed(1)
      );

      const estimatedCost = Number(
        (
          offering.unitPurchasePrice *
          Math.max(
            quantity,
            offering.minOrderQuantity
          )
        ).toFixed(2)
      );

      const reasons: string[] = [];

      if (
        offering.unitPurchasePrice === minPrice
      ) {
        reasons.push(
          'Lowest purchase price among available suppliers'
        );
      } else {
        reasons.push(
          `₹${offering.unitPurchasePrice.toFixed(
            2
          )} per unit purchase price`
        );
      }

      reasons.push(
        `${supplier.onTimeDeliveryRate}% on-time delivery`
      );

      reasons.push(
        `${supplier.rating.toFixed(1)}/5 supplier rating`
      );

      reasons.push(
        `${offering.leadTimeDays}-day lead time`
      );

      if (offering.availability === 'limited') {
        reasons.push('Limited availability');
      }

      if (supplier.id === medicine.supplierId) {
        reasons.push(
          'Existing supplier relationship'
        );
      }

      return {
        supplier,
        offering,
        score,
        estimatedCost,
        reasons
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate distance between two geographic coordinates.
 */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

/**
 * Recommend the best pharmacy for a customer.
 *
 * Ranking factors:
 * - Medicine price: 30%
 * - Pharmacy rating: 25%
 * - Stock availability: 20%
 * - Distance: 15%
 * - Delivery availability: 10%
 */
export function recommendPharmacies(
  query: string,
  pharmacies: Pharmacy[],
  inventory: PharmacyInventoryOffer[],
  userLocation?: {
    latitude: number;
    longitude: number;
  }
): PharmacyRecommendation[] {
  const q = query.trim().toLowerCase();

  if (!q) {
    return [];
  }

  const candidates = inventory
    .filter((o) => o.stock > 0)
    .filter((o) =>
      [
        o.medicineName,
        o.genericName,
        o.strength,
        o.dosageForm
      ].some((v) =>
        v.toLowerCase().includes(q)
      )
    )
    .map((offer) => {
      const pharmacy = pharmacies.find(
        (p) =>
          p.id === offer.pharmacyId &&
          p.status === 'active'
      );

      if (!pharmacy) {
        return null;
      }

      const distanceKm = userLocation
        ? haversineKm(
            userLocation.latitude,
            userLocation.longitude,
            pharmacy.latitude,
            pharmacy.longitude
          )
        : undefined;

      return {
        pharmacy,
        offer,
        distanceKm
      };
    })
    .filter(Boolean) as Array<{
    pharmacy: Pharmacy;
    offer: PharmacyInventoryOffer;
    distanceKm?: number;
  }>;

  if (!candidates.length) {
    return [];
  }

  const prices = candidates.map(
    (c) => c.offer.price
  );

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const maxDistance = Math.max(
    ...candidates.map(
      (c) => c.distanceKm ?? 10
    ),
    1
  );

  return candidates
    .map(
      ({
        pharmacy,
        offer,
        distanceKm
      }) => {
        const priceScore =
          maxPrice === minPrice
            ? 100
            : 100 -
              ((offer.price - minPrice) /
                (maxPrice - minPrice)) *
                100;

        const ratingScore =
          (pharmacy.rating / 5) * 100;

        const stockScore = clamp(
          offer.stock >= 20
            ? 100
            : offer.stock >= 5
            ? 75
            : 50
        );

        const distanceScore =
          distanceKm === undefined
            ? 70
            : 100 -
              Math.min(
                100,
                (distanceKm /
                  maxDistance) *
                  100
              );

        const deliveryScore =
          pharmacy.deliveryAvailable
            ? 100
            : 65;

        const score = Number(
          (
            priceScore * 0.30 +
            ratingScore * 0.25 +
            stockScore * 0.20 +
            distanceScore * 0.15 +
            deliveryScore * 0.10
          ).toFixed(1)
        );

        const reasons: string[] = [];

        reasons.push(
          `₹${offer.price.toFixed(
            2
          )} selling price`
        );

        reasons.push(
          `${pharmacy.rating.toFixed(
            1
          )}/5 customer rating`
        );

        reasons.push(
          `${offer.stock} units currently available`
        );

        if (distanceKm !== undefined) {
          reasons.push(
            `${distanceKm.toFixed(
              1
            )} km away`
          );
        }

        if (pharmacy.deliveryAvailable) {
          reasons.push(
            `Delivery available (₹${pharmacy.deliveryFee.toFixed(
              0
            )})`
          );
        }

        if (pharmacy.open24Hours) {
          reasons.push('Open 24 hours');
        }

        return {
          pharmacy,
          offer,
          score,
          distanceKm,
          reasons
        };
      }
    )
    .sort((a, b) => b.score - a.score);
}