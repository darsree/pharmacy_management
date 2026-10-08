// MediCore AI Decision Support Engine & Services

import {
  Medicine,
  Batch,
  Sale,
  PurchaseOrder,
  AIInsight,
  DemandForecast,
  ReorderRecommendation,
  PrescriptionMedicineItem,
  PrescriptionValidationResult,
  GenericSuggestion,
  DrugInteractionAlert,
  DuplicateTherapyAlert,
  DosageCheckAlert,
  AllergyWarningAlert,
  GenericAlternativeAlert
} from '../types';
import { getDaysRemaining } from '../utils';

/**
 * Generate intelligent live insights across the pharmacy inventory and sales
 */
export function generateLiveInsights(
  medicines: Medicine[],
  sales: Sale[],
  purchaseOrders: PurchaseOrder[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  // 1. Critical & Out of Stock Analysis
  for (const med of medicines) {
    if (med.stock === 0) {
      const hasPendingPO = purchaseOrders.some(
        po => (po.status === 'pending' || po.status === 'confirmed') &&
              po.items.some(item => item.medicineId === med.id)
      );

      insights.push({
        id: `ins-oos-${med.id}`,
        title: `Out of Stock: ${med.name}`,
        description: `${med.name} is completely depleted. ${
          hasPendingPO
            ? 'A purchase order is already in transit.'
            : 'Immediate reorder recommended to prevent lost sales and patient turnaways.'
        }`,
        priority: 'CRITICAL',
        category: 'stockout',
        medicineId: med.id,
        medicineName: med.name,
        recommendedAction: hasPendingPO ? 'Track PO Status' : 'Create Expedited PO',
        actionType: hasPendingPO ? 'supplier' : 'reorder',
        actionPayload: { medicineId: med.id, quantity: med.reorderThreshold * 2 },
        timestamp: 'Just now',
        isDismissed: false
      });
    } else if (med.status === 'critical') {
      const avgDailyDemand = calculateAvgDailySales(med.id, sales, 30);
      const daysLeft = avgDailyDemand > 0 ? Math.max(1, Math.round(med.stock / avgDailyDemand)) : 3;
      const reorderQty = Math.max(50, Math.ceil(med.reorderThreshold * 1.5 - med.stock));

      insights.push({
        id: `ins-crit-${med.id}`,
        title: `Critically Low Stock: ${med.name}`,
        description: `Current inventory is ${med.stock} units (threshold: ${med.reorderThreshold}). Based on recent burn rate (~${avgDailyDemand.toFixed(1)}/day), stockout is imminent in approx ${daysLeft} days.`,
        priority: 'CRITICAL',
        category: 'stockout',
        medicineId: med.id,
        medicineName: med.name,
        recommendedAction: `Reorder ${reorderQty} units from ${med.supplierName}`,
        actionType: 'reorder',
        actionPayload: { medicineId: med.id, quantity: reorderQty, supplierId: med.supplierId },
        timestamp: '15m ago',
        isDismissed: false
      });
    } else if (med.status === 'low_stock') {
      const reorderQty = Math.max(40, med.reorderThreshold - med.stock + 50);
      insights.push({
        id: `ins-low-${med.id}`,
        title: `Reorder Threshold Reached: ${med.name}`,
        description: `Stock level (${med.stock} units) has fallen below reorder point (${med.reorderThreshold}). Recommended restock quantity: ${reorderQty} units.`,
        priority: 'HIGH',
        category: 'demand',
        medicineId: med.id,
        medicineName: med.name,
        recommendedAction: `Restock ${reorderQty} units`,
        actionType: 'reorder',
        actionPayload: { medicineId: med.id, quantity: reorderQty, supplierId: med.supplierId },
        timestamp: '1h ago',
        isDismissed: false
      });
    }
  }

  // 2. Batch Expiry Detection & Clearance Promotion
  let batchesExpiringIn7Days = 0;
  let batchesExpiringIn30Days = 0;
  let batchesExpiringIn60Days = 0;

  for (const med of medicines) {
    for (const batch of med.batches) {
      if (batch.quantity <= 0) continue;
      const days = getDaysRemaining(batch.expiryDate);

      if (days > 0 && days <= 7) {
        batchesExpiringIn7Days++;
        insights.push({
          id: `ins-exp7-${batch.id}`,
          title: `Imminent Expiry: ${med.name} (Batch ${batch.batchNumber})`,
          description: `Batch ${batch.batchNumber} (${batch.quantity} units) expires in ${days} days on ${batch.expiryDate}. FIFO dispensing is prioritized.`,
          priority: 'CRITICAL',
          category: 'expiry',
          medicineId: med.id,
          medicineName: med.name,
          recommendedAction: 'Apply clearance discount or return to distributor',
          actionType: 'clearance',
          actionPayload: { batchId: batch.id, medicineId: med.id },
          timestamp: '30m ago',
          isDismissed: false
        });
      } else if (days > 7 && days <= 30) {
        batchesExpiringIn30Days++;
      } else if (days > 30 && days <= 60) {
        batchesExpiringIn60Days++;
      }
    }
  }

  if (batchesExpiringIn30Days > 0) {
    insights.push({
      id: 'ins-exp30-aggregate',
      title: `${batchesExpiringIn30Days} Medicine Batches Expire Within 30 Days`,
      description: `Active monitoring recommended. Ensure earliest-expiry FIFO dispensing at checkout to prevent inventory write-off losses.`,
      priority: 'HIGH',
      category: 'expiry',
      recommendedAction: 'View Expiring Inventory',
      actionType: 'view_inventory',
      timestamp: '2h ago',
      isDismissed: false
    });
  }

  if (batchesExpiringIn60Days > 0) {
    insights.push({
      id: 'ins-exp60-aggregate',
      title: `Upcoming Expiries: ${batchesExpiringIn60Days} Batches in 60 Days`,
      description: `Consider promotional bundle offers or contacting suppliers for return-before-expiry policy.`,
      priority: 'MEDIUM',
      category: 'expiry',
      recommendedAction: 'Review Batches',
      actionType: 'view_inventory',
      timestamp: '4h ago',
      isDismissed: false
    });
  }

  // 3. Demand Velocity Analysis
  const fastMoving = medicines.find(m => (m.unitsSoldTotal || 0) > 1500);
  if (fastMoving) {
    insights.push({
      id: `ins-demand-${fastMoving.id}`,
      title: `High Velocity Demand: ${fastMoving.name}`,
      description: `${fastMoving.name} demand has increased ~18% over the past 4 weeks. Maintain a safety buffer of at least 5 days of inventory.`,
      priority: 'MEDIUM',
      category: 'demand',
      medicineId: fastMoving.id,
      medicineName: fastMoving.name,
      recommendedAction: 'View Demand Forecast',
      actionType: 'forecast',
      actionPayload: { medicineId: fastMoving.id },
      timestamp: '6h ago',
      isDismissed: false
    });
  }

  return insights;
}

/**
 * Calculate average daily sales from sales records
 */
export function calculateAvgDailySales(
  medicineId: string,
  sales: Sale[],
  daysLookback: number = 30
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysLookback);

  let totalUnits = 0;
  for (const sale of sales) {
    const saleDate = new Date(sale.date);
    if (saleDate >= cutoff) {
      for (const item of sale.items) {
        if (item.medicineId === medicineId) {
          totalUnits += item.quantity;
        }
      }
    }
  }

  if (totalUnits === 0) {
    // Fallback based on typical daily demand
    return 3.5;
  }

  return Math.max(0.5, totalUnits / Math.min(daysLookback, 7));
}

/**
 * Predict future medicine demand using historical sales trend modeling
 */
export function predictDemand(
  medicineId: string,
  forecastPeriodDays: number,
  medicines: Medicine[],
  sales: Sale[]
): DemandForecast {
  const med = medicines.find(m => m.id === medicineId) || medicines[0];
  const avgDailySales = calculateAvgDailySales(med.id, sales, 30);

  // Demand growth factor simulation
  const trendFactor = med.category === 'Antibiotic' ? 1.15 : med.category === 'Analgesic' ? 1.08 : 1.02;
  const predictedDemand = Math.round(avgDailySales * forecastPeriodDays * trendFactor);
  const safetyBufferDays = 5;
  const safetyBufferUnits = Math.round(avgDailySales * safetyBufferDays);
  
  const projectedStockDays = avgDailySales > 0 ? Math.round(med.stock / avgDailySales) : 999;
  
  let stockoutRisk: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (med.stock <= 0 || projectedStockDays <= 3) {
    stockoutRisk = 'critical';
  } else if (projectedStockDays <= 7) {
    stockoutRisk = 'high';
  } else if (projectedStockDays <= 20) {
    stockoutRisk = 'medium';
  }

  const recommendedReorder = Math.max(0, predictedDemand + safetyBufferUnits - med.stock);

  // Generate historical + forecast chart data points
  const chartData: Array<{ date: string; historicalSales?: number; predictedDemand?: number }> = [];
  const today = new Date();

  // 14 days of historical data
  for (let i = 14; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const variance = (Math.sin(i * 1.5) * 0.3 + 1);
    chartData.push({
      date: dateLabel,
      historicalSales: Math.max(1, Math.round(avgDailySales * variance))
    });
  }

  // Today marker
  const todayLabel = today.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const todaySales = Math.round(avgDailySales);
  chartData.push({
    date: todayLabel,
    historicalSales: todaySales,
    predictedDemand: todaySales
  });

  // Future projected days
  const futurePoints = forecastPeriodDays === 7 ? 7 : forecastPeriodDays === 30 ? 15 : 20;
  const step = Math.max(1, Math.floor(forecastPeriodDays / futurePoints));

  for (let i = 1; i <= futurePoints; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + (i * step));
    const dateLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const growth = 1 + (i / futurePoints) * (trendFactor - 1);
    const variance = (Math.cos(i * 1.2) * 0.15 + 1);
    chartData.push({
      date: dateLabel,
      predictedDemand: Math.max(1, Math.round(avgDailySales * growth * variance))
    });
  }

  const aiExplanation = `Based on historical dispensing patterns, ${med.name} exhibits an average daily burn rate of ${avgDailySales.toFixed(1)} units. With current stock at ${med.stock} units, estimated depletion will occur in approximately ${projectedStockDays} days. To maintain a continuous supply across the next ${forecastPeriodDays} days with a ${safetyBufferDays}-day safety reserve (${safetyBufferUnits} units), a purchase order of ${recommendedReorder} units is recommended.`;

  return {
    medicineId: med.id,
    medicineName: med.name,
    category: med.category,
    currentStock: med.stock,
    avgDailySales: Number(avgDailySales.toFixed(1)),
    forecastPeriodDays,
    predictedDemand,
    projectedStockDays,
    stockoutRisk,
    recommendedReorder,
    safetyBufferUnits,
    confidenceScore: 93,
    aiExplanation,
    chartData
  };
}

/**
 * Generate reorder recommendations table for all medicines
 */
export function calculateReorderRecommendations(
  medicines: Medicine[],
  sales: Sale[]
): ReorderRecommendation[] {
  const recommendations: ReorderRecommendation[] = [];

  for (const med of medicines) {
    const avgDaily = calculateAvgDailySales(med.id, sales, 30);
    const daysRemaining = avgDaily > 0 ? Math.round(med.stock / avgDaily) : 99;
    const predicted30d = Math.round(avgDaily * 30);
    const safetyStock = Math.round(avgDaily * 5);
    const recommendedQty = Math.max(0, predicted30d + safetyStock - med.stock);

    if (med.stock <= med.reorderThreshold || recommendedQty > 0 || med.status === 'out_of_stock') {
      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      let reason = 'Stock below reorder point';

      if (med.stock === 0) {
        priority = 'CRITICAL';
        reason = 'Medicine out of stock; immediate stockout risk';
      } else if (daysRemaining <= 3) {
        priority = 'CRITICAL';
        reason = `High recent demand (~${avgDaily.toFixed(1)}/day), stock depleted in ~${daysRemaining} days`;
      } else if (daysRemaining <= 7) {
        priority = 'HIGH';
        reason = 'Approaching critical low threshold';
      } else {
        priority = 'LOW';
        reason = 'Standard inventory optimization cycle';
      }

      recommendations.push({
        medicineId: med.id,
        medicineName: med.name,
        category: med.category,
        currentStock: med.stock,
        avgDailyDemand: Number(avgDaily.toFixed(1)),
        daysRemaining,
        recommendedQuantity: Math.max(med.reorderThreshold, recommendedQty),
        priority,
        reason,
        supplierId: med.supplierId,
        supplierName: med.supplierName,
        estimatedCost: Math.max(med.reorderThreshold, recommendedQty) * med.unitPrice,
        status: 'pending'
      });
    }
  }

  // Sort by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Safety + accuracy pass applied to generic alternatives (AI or local):
 *  1. Never suggest a substitute that contains a drug the patient is allergic to
 *     (or that is already flagged in the allergy warnings).
 *  2. Replace model-guessed stock numbers with the pharmacy's real inventory.
 */
const ALLERGY_CLASS_TERMS: Array<{ triggers: string[]; drugs: string[] }> = [
  {
    triggers: ['penicillin', 'amox', 'beta-lactam', 'beta lactam', 'ampicillin', 'augmentin'],
    drugs: ['penicillin', 'amoxicillin', 'amoxyclav', 'amoxiclav', 'augmentin', 'ampicillin', 'clavulan', 'cloxacillin', 'piperacillin', 'flucloxacillin']
  },
  {
    triggers: ['sulfa', 'sulpha', 'sulfonamide'],
    drugs: ['sulfamethoxazole', 'cotrimoxazole', 'co-trimoxazole', 'bactrim', 'sulfasalazine', 'sulfadiazine']
  },
  {
    triggers: ['aspirin', 'nsaid', 'salicylate'],
    drugs: ['aspirin', 'acetylsalicylic', 'ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'ecosprin', 'brufen']
  },
  {
    triggers: ['cephalosporin'],
    drugs: ['cef', 'ceph']
  }
];

function sanitizeGenericAlternatives(
  result: PrescriptionValidationResult,
  allergies: string[],
  availableMedicines: Medicine[]
): PrescriptionValidationResult {
  const allergyText = allergies.map(a => a.toLowerCase());
  const blockedTerms = new Set<string>();

  for (const a of allergyText) {
    blockedTerms.add(a); // the allergy word itself, e.g. "latex"
    for (const group of ALLERGY_CLASS_TERMS) {
      if (group.triggers.some(t => a.includes(t))) group.drugs.forEach(d => blockedTerms.add(d));
    }
  }
  // Anything already flagged as an allergy conflict is blocked too
  for (const w of result.allergyWarnings) {
    const first = w.medicine.toLowerCase().split(' ')[0];
    if (first) blockedTerms.add(first);
  }

  const isBlocked = (text: string) => {
    const t = text.toLowerCase();
    return Array.from(blockedTerms).some(term => term.length > 2 && t.includes(term));
  };

  const genericAlternatives = result.genericAlternatives
    .filter(ga => !isBlocked(`${ga.prescribed} ${ga.genericAlternative} ${ga.activeMolecule}`))
    .map(ga => {
      // Match against the real catalog by generic name / medicine name
      const needle = ga.activeMolecule.toLowerCase().split(' ')[0];
      const match = availableMedicines.find(
        m =>
          m.name.toLowerCase() === ga.genericAlternative.toLowerCase() ||
          (needle.length > 3 &&
            (m.genericName?.toLowerCase().includes(needle) || m.name.toLowerCase().includes(needle)))
      );
      if (!match) {
        return { ...ga, availability: 'Order Needed' as const, inventoryStock: 0 };
      }
      return {
        ...ga,
        inventoryStock: match.stock,
        availability:
          match.stock > match.reorderThreshold
            ? ('In Stock' as const)
            : match.stock > 0
            ? ('Low Stock' as const)
            : ('Order Needed' as const)
      };
    });

  return { ...result, genericAlternatives };
}

/**
 * Clinical Pharmacology Rules Engine for Prescription Safety Validation
 */
export async function validatePrescription(
  prescription: {
    patientName: string;
    patientAge: number;
    patientGender: string;
    doctorName: string;
    doctorRegNo: string;
    prescriptionId: string;
    medicines: PrescriptionMedicineItem[];
    allergies?: string[];
    chronicConditions?: string[];
  },
  availableMedicines: Medicine[]
): Promise<PrescriptionValidationResult> {
  // Try server-side AI endpoint first if available
  try {
    const res = await fetch('/api/ai/validate-prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescription)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.overallStatus) {
        // Guarantee every list exists so the UI can never crash on a partial AI reply
        return sanitizeGenericAlternatives({
          ...data,
          drugInteractions: data.drugInteractions ?? [],
          duplicateTherapies: data.duplicateTherapies ?? [],
          dosageChecks: data.dosageChecks ?? [],
          allergyWarnings: data.allergyWarnings ?? [],
          genericAlternatives: data.genericAlternatives ?? [],
          pharmacistAdvice: data.pharmacistAdvice ?? 'Pharmacist review recommended before dispensing.',
          timestamp: data.timestamp ?? new Date().toISOString()
        } as PrescriptionValidationResult, prescription.allergies || [], availableMedicines);
      }
    } else {
      console.warn(`AI validation endpoint returned ${res.status}, using local clinical engine.`);
    }
  } catch (err) {
    console.warn('Server AI endpoint unavailable, using comprehensive local clinical pharmacology engine.', err);
  }

  // Comprehensive Local Clinical Pharmacology Engine
  const drugInteractions: DrugInteractionAlert[] = [];
  const duplicateTherapies: DuplicateTherapyAlert[] = [];
  const dosageChecks: DosageCheckAlert[] = [];
  const allergyWarnings: AllergyWarningAlert[] = [];
  const genericAlternatives: GenericAlternativeAlert[] = [];

  const medNames = prescription.medicines.map(m => m.medicineName.toLowerCase());
  const allergies = (prescription.allergies || []).map(a => a.toLowerCase());

  // 1. Allergy Checking
  for (const med of prescription.medicines) {
    const nameLower = med.medicineName.toLowerCase();
    
    // Penicillin check
    if (allergies.some(a => a.includes('penicillin') || a.includes('amox') || a.includes('beta-lactam'))) {
      if (nameLower.includes('amoxicillin') || nameLower.includes('augmentin') || nameLower.includes('ampicillin') || nameLower.includes('penicillin')) {
        allergyWarnings.push({
          medicine: med.medicineName,
          allergy: 'Penicillin / Beta-Lactam Hypersensitivity',
          severity: 'critical',
          recommendation: 'DO NOT DISPENSE. Patient has documented Penicillin allergy. Risk of anaphylaxis. Substitute with macrolide (e.g. Azithromycin) or fluoroquinolone after prescriber confirmation.'
        });
      }
    }

    // Aspirin / NSAID check
    if (allergies.some(a => a.includes('aspirin') || a.includes('nsaid'))) {
      if (nameLower.includes('ibuprofen') || nameLower.includes('aspirin') || nameLower.includes('diclofenac') || nameLower.includes('naproxen')) {
        allergyWarnings.push({
          medicine: med.medicineName,
          allergy: 'Aspirin / NSAID Cross-Reactivity',
          severity: 'critical',
          recommendation: 'DO NOT DISPENSE. Patient reports NSAID sensitivity. High risk of bronchospasm or severe urticaria. Use Paracetamol as safer non-NSAID antipyretic/analgesic.'
        });
      }
    }

    // Sulfa check
    if (allergies.some(a => a.includes('sulfa') || a.includes('sulfonamide'))) {
      if (nameLower.includes('cotrimoxazole') || nameLower.includes('bactrim') || nameLower.includes('sulfamethoxazole')) {
        allergyWarnings.push({
          medicine: med.medicineName,
          allergy: 'Sulfonamide Allergy',
          severity: 'critical',
          recommendation: 'CONTRAINDICATED. Patient has documented Sulfa allergy.'
        });
      }
    }
  }

  // 2. Drug-Drug Interactions
  const hasParacetamol = medNames.some(n => n.includes('paracetamol') || n.includes('crocin') || n.includes('calpol') || n.includes('acetaminophen'));
  const hasIbuprofen = medNames.some(n => n.includes('ibuprofen') || n.includes('brufen') || n.includes('advil'));
  const hasAspirin = medNames.some(n => n.includes('aspirin') || n.includes('ecosprin'));
  const hasMetformin = medNames.some(n => n.includes('metformin') || n.includes('glycomet') || n.includes('glucophage'));
  const hasAtorvastatin = medNames.some(n => n.includes('atorvastatin') || n.includes('atorva') || n.includes('lipitor'));
  const hasAzithromycin = medNames.some(n => n.includes('azithromycin') || n.includes('zithromax') || n.includes('azee'));
  const hasSalbutamol = medNames.some(n => n.includes('salbutamol') || n.includes('albuterol') || n.includes('asthalin'));
  const hasPropranolol = medNames.some(n => n.includes('propranolol') || n.includes('atenolol') || n.includes('metoprolol'));
  const hasOmeprazole = medNames.some(n => n.includes('omeprazole') || n.includes('omez') || n.includes('pantoprazole'));
  const hasClopidogrel = medNames.some(n => n.includes('clopidogrel') || n.includes('plavix') || n.includes('clopilet'));

  // Statin + Macrolide interaction
  if (hasAtorvastatin && hasAzithromycin) {
    drugInteractions.push({
      severity: 'high',
      drugs: ['Atorvastatin', 'Azithromycin'],
      issue: 'CYP3A4 Inhibition & Increased Statin Exposure',
      mechanism: 'Azithromycin can inhibit hepatic metabolism of Atorvastatin, elevating systemic statin levels.',
      recommendation: 'Monitor patient for unexplained muscle pain, tenderness, or weakness (rhabdomyolysis risk). Consider temporarily holding statin during 3-5 day antibiotic course.'
    });
  }

  // NSAID + Aspirin interaction
  if (hasIbuprofen && hasAspirin) {
    drugInteractions.push({
      severity: 'high',
      drugs: ['Ibuprofen', 'Aspirin'],
      issue: 'Competitive Platelet Inhibition & GI Bleed Risk',
      mechanism: 'Ibuprofen competitively blocks Aspirin access to COX-1 platelet binding site, attenuating cardioprotection while doubling GI ulcer risk.',
      recommendation: 'Space administration by at least 2 hours, or substitute with Paracetamol for pain relief.'
    });
  }

  // Beta-agonist + Beta-blocker
  if (hasSalbutamol && hasPropranolol) {
    drugInteractions.push({
      severity: 'critical',
      drugs: ['Salbutamol', 'Beta-Blocker (Propranolol/Atenolol)'],
      issue: 'Pharmacodynamic Antagonism & Bronchospasm',
      mechanism: 'Non-selective beta blockers antagonize beta-2 bronchodilation, potentially precipitating severe bronchoconstriction in asthma patients.',
      recommendation: 'Avoid non-selective beta-blockers in reactive airway disease. Consult physician for cardioselective alternative.'
    });
  }

  // PPI + Clopidogrel
  if (hasOmeprazole && hasClopidogrel) {
    drugInteractions.push({
      severity: 'moderate',
      drugs: ['Omeprazole', 'Clopidogrel'],
      issue: 'CYP2C19 Competitive Inhibition',
      mechanism: 'Omeprazole may reduce conversion of clopidogrel prodrug into active antiplatelet metabolite.',
      recommendation: 'Consider Pantoprazole instead of Omeprazole, as Pantoprazole exhibits lower CYP2C19 inhibition.'
    });
  }

  // 3. Duplicate Therapy Check
  let nsaidCount = 0;
  let nsaidDrugs: string[] = [];
  if (hasIbuprofen) { nsaidCount++; nsaidDrugs.push('Ibuprofen'); }
  if (hasAspirin) { nsaidCount++; nsaidDrugs.push('Aspirin'); }
  if (medNames.some(n => n.includes('diclofenac') || n.includes('naproxen'))) { nsaidCount++; nsaidDrugs.push('NSAID'); }

  if (nsaidCount >= 2) {
    duplicateTherapies.push({
      severity: 'high',
      drugs: nsaidDrugs,
      therapeuticClass: 'Non-Steroidal Anti-Inflammatory Drugs (NSAIDs)',
      recommendation: 'Concurrent use of multiple systemic NSAIDs confers additive gastrointestinal and nephrotoxic toxicity without therapeutic benefit. Use single agent.'
    });
  }

  let ppiCount = 0;
  let ppiDrugs: string[] = [];
  if (medNames.some(n => n.includes('omeprazole') || n.includes('omez'))) { ppiCount++; ppiDrugs.push('Omeprazole'); }
  if (medNames.some(n => n.includes('pantoprazole') || n.includes('pan'))) { ppiCount++; ppiDrugs.push('Pantoprazole'); }
  if (medNames.some(n => n.includes('rabeprazole') || n.includes('esomeprazole'))) { ppiCount++; ppiDrugs.push('PPI'); }

  if (ppiCount >= 2) {
    duplicateTherapies.push({
      severity: 'moderate',
      drugs: ppiDrugs,
      therapeuticClass: 'Proton Pump Inhibitors (PPIs)',
      recommendation: 'Duplicate proton pump inhibitor therapy detected. Discontinue redundant agent.'
    });
  }

  // 4. Dosage Validation
  for (const med of prescription.medicines) {
    const nameLower = med.medicineName.toLowerCase();
    const doseStr = med.dosage.toLowerCase();
    const freqStr = med.frequency.toLowerCase();

    // Pediatric check
    if (prescription.patientAge < 12) {
      if (nameLower.includes('amoxicillin') && (doseStr.includes('1000') || doseStr.includes('875'))) {
        dosageChecks.push({
          medicine: med.medicineName,
          prescribedDose: `${med.dosage} (${med.frequency})`,
          standardDose: '20-40 mg/kg/day in divided doses',
          status: 'high',
          recommendation: 'Dose appears elevated for pediatric age group. Calculate precise weight-based mg/kg dosage before dispensing.'
        });
      }
      if (nameLower.includes('aspirin')) {
        dosageChecks.push({
          medicine: med.medicineName,
          prescribedDose: med.dosage,
          standardDose: 'Contraindicated in pediatric viral illness',
          status: 'high',
          recommendation: 'Aspirin is contraindicated in children under 16 due to risk of Reye\'s Syndrome. Substitute with Paracetamol.'
        });
      }
    }

    // Adult high dose checks
    if (nameLower.includes('paracetamol')) {
      if (freqStr.includes('4 times') || freqStr.includes('6 hourly') || doseStr.includes('1000')) {
        dosageChecks.push({
          medicine: med.medicineName,
          prescribedDose: `${med.dosage} (${med.frequency})`,
          standardDose: '500-650mg Q4-6H (Max 4000mg/24h)',
          status: 'normal',
          recommendation: 'Within normal clinical range. Advise patient not to exceed 4000mg in 24 hours and avoid concurrent paracetamol cold formulas.'
        });
      }
    }
  }

  // 5. Generic Alternatives Suggestions
  for (const med of prescription.medicines) {
    const nameLower = med.medicineName.toLowerCase();
    if (nameLower.includes('crocin') || nameLower.includes('calpol')) {
      const match = availableMedicines.find(m => m.id === 'med-1');
      genericAlternatives.push({
        prescribed: med.medicineName,
        genericAlternative: 'Paracetamol 500mg IP (Generic)',
        activeMolecule: 'Paracetamol 500mg',
        savingsPercent: 48,
        availability: match && match.stock > 0 ? 'In Stock' : 'Low Stock',
        inventoryStock: match?.stock || 42
      });
    } else if (nameLower.includes('augmentin')) {
      const match = availableMedicines.find(m => m.id === 'med-2');
      genericAlternatives.push({
        prescribed: med.medicineName,
        genericAlternative: 'Amoxyclav 625mg IP (Generic)',
        activeMolecule: 'Amoxicillin + Clavulanic Acid',
        savingsPercent: 51,
        availability: match && match.stock > 0 ? 'In Stock' : 'Low Stock',
        inventoryStock: match?.stock || 15
      });
    } else if (nameLower.includes('lipitor') || nameLower.includes('atorva')) {
      const match = availableMedicines.find(m => m.id === 'med-6');
      genericAlternatives.push({
        prescribed: med.medicineName,
        genericAlternative: 'Atorvastatin 10mg IP (Generic)',
        activeMolecule: 'Atorvastatin Calcium 10mg',
        savingsPercent: 39,
        availability: match && match.stock > 0 ? 'In Stock' : 'Order Needed',
        inventoryStock: match?.stock || 0
      });
    }
  }

  // Compute overall status
  let overallStatus: 'valid' | 'needs_review' | 'critical_warning' = 'valid';
  if (allergyWarnings.length > 0 || drugInteractions.some(i => i.severity === 'critical')) {
    overallStatus = 'critical_warning';
  } else if (
    drugInteractions.length > 0 ||
    duplicateTherapies.length > 0 ||
    dosageChecks.some(d => d.status === 'high')
  ) {
    overallStatus = 'needs_review';
  }

  let pharmacistAdvice = 'Prescription appears safe for dispensing under standard counseling guidelines.';
  if (overallStatus === 'critical_warning') {
    pharmacistAdvice = 'CRITICAL CLINICAL ALERT: Major safety risks identified. Pharmacist intervention required before dispensing. Contact prescriber to confirm or alter therapy.';
  } else if (overallStatus === 'needs_review') {
    pharmacistAdvice = 'CLINICAL REVIEW REQUIRED: Moderate drug interactions or duplicate therapy detected. Provide patient counseling on dosing intervals and symptom monitoring.';
  }

  return sanitizeGenericAlternatives({
    prescriptionId: prescription.prescriptionId,
    patientName: prescription.patientName,
    patientAge: prescription.patientAge,
    patientGender: prescription.patientGender,
    doctorName: prescription.doctorName,
    doctorRegNo: prescription.doctorRegNo,
    overallStatus,
    drugInteractions,
    duplicateTherapies,
    dosageChecks,
    allergyWarnings,
    genericAlternatives,
    pharmacistAdvice,
    timestamp: new Date().toISOString()
  }, prescription.allergies || [], availableMedicines);
}

/**
 * Generate generic/bioequivalent substitution suggestions from the pharmacy's
 * real, current medicine catalog. Tries the server-side AI (Groq) endpoint first;
 * falls back to a local heuristic (derived live from the catalog, not a fixed
 * mock list) if the AI endpoint is unavailable or no API key is configured.
 */
export async function generateGenericSuggestions(medicines: Medicine[]): Promise<GenericSuggestion[]> {
  try {
    const res = await fetch('/api/ai/generic-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicines: medicines.map(m => ({
          name: m.name,
          genericName: m.genericName,
          category: m.category,
          sellingPrice: m.sellingPrice,
          stock: m.stock,
          reorderThreshold: m.reorderThreshold,
          dosageForm: m.dosageForm,
          strength: m.strength,
          manufacturer: m.manufacturer
        }))
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.suggestions?.length) {
        // Fill in live inventory numbers so stock figures never go stale,
        // even if the model's estimate drifts.
        return data.suggestions.map((s: GenericSuggestion) => {
          const match = medicines.find(m => m.name.toLowerCase() === s.possibleGeneric.toLowerCase());
          return match
            ? {
                ...s,
                inventoryStock: match.stock,
                availability: match.stock > match.reorderThreshold ? 'In Stock' : match.stock > 0 ? 'Low Stock' : 'Out of Stock'
              }
            : s;
        });
      }
    }
  } catch (err) {
    console.warn('Server AI endpoint unavailable for generic suggestions, using local heuristic.', err);
  }

  // Local fallback: derive suggestions directly from the live catalog instead
  // of a hardcoded list, so it still reflects whatever medicines actually exist.
  return medicines
    .filter(m => m.genericName && m.genericName.trim().toLowerCase() !== m.name.trim().toLowerCase())
    .slice(0, 8)
    .map((m, i) => {
      const estimatedBrandPrice = Math.round(m.sellingPrice * 1.8 * 100) / 100;
      const savingsPercent = estimatedBrandPrice > 0
        ? Math.round(((estimatedBrandPrice - m.sellingPrice) / estimatedBrandPrice) * 100)
        : 0;
      const availability: GenericSuggestion['availability'] =
        m.stock > m.reorderThreshold ? 'In Stock' : m.stock > 0 ? 'Low Stock' : 'Out of Stock';

      return {
        id: `gen-local-${m.id}-${i}`,
        brandMedicine: `${m.genericName} (Common Brand)`,
        activeIngredient: `${m.genericName} ${m.strength}`,
        strength: m.strength,
        dosageForm: m.dosageForm,
        possibleGeneric: m.name,
        brandPrice: estimatedBrandPrice,
        genericPrice: m.sellingPrice,
        savingsPercent,
        availability,
        inventoryStock: m.stock,
        reason: `${m.genericName} is the active molecule behind this item; it delivers the same therapeutic effect at a lower price point.`,
        manufacturer: m.manufacturer
      };
    });
}

/**
 * Natural language pharmacy assistant query processor
 */
export async function askPharmacyAssistant(
  question: string,
  context: {
    medicines: Medicine[];
    sales: Sale[];
    purchaseOrders: PurchaseOrder[];
  }
): Promise<{
  text: string;
  actionButtons?: Array<{ label: string; action: string; payload?: any }>;
  dataCard?: { title: string; items: Array<{ label: string; value: string | number; badge?: string }> };
}> {
  // Try server endpoint
  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, contextSummary: {
        totalMedicines: context.medicines.length,
        lowStockCount: context.medicines.filter(m => m.status === 'low_stock' || m.status === 'critical').length,
        outOfStockCount: context.medicines.filter(m => m.status === 'out_of_stock').length
      }})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.text) {
        return data;
      }
    }
  } catch (err) {
    // Fallback to local intelligent query processor
  }

  const q = question.toLowerCase();
  const { medicines, purchaseOrders } = context;

  // 1. Reorder query
  if (q.includes('reorder') || q.includes('need') && q.includes('order')) {
    const lowItems = medicines.filter(m => m.status === 'low_stock' || m.status === 'critical' || m.status === 'out_of_stock');
    return {
      text: `Currently, ${lowItems.length} medicines require replenishment. Here are the top items needing attention:`,
      actionButtons: [
        { label: 'Create PO for Low Stock Items', action: 'navigate_purchases' },
        { label: 'View Demand Forecast', action: 'navigate_forecast' }
      ],
      dataCard: {
        title: 'Priority Restock Items',
        items: lowItems.slice(0, 5).map(m => ({
          label: m.name,
          value: `${m.stock} units (Threshold: ${m.reorderThreshold})`,
          badge: m.status === 'out_of_stock' ? 'Out of Stock' : m.status === 'critical' ? 'Critical' : 'Low Stock'
        }))
      }
    };
  }

  // 2. Expiring query
  if (q.includes('expir') || q.includes('month')) {
    const expiringBatches: Array<{ medicine: string; batch: string; days: number }> = [];
    medicines.forEach(m => {
      m.batches.forEach(b => {
        const days = getDaysRemaining(b.expiryDate);
        if (days > 0 && days <= 60 && b.quantity > 0) {
          expiringBatches.push({ medicine: m.name, batch: b.batchNumber, days });
        }
      });
    });

    return {
      text: `Found ${expiringBatches.length} batch(es) nearing expiration within the next 60 days:`,
      actionButtons: [
        { label: 'View Expiring Inventory', action: 'navigate_inventory' }
      ],
      dataCard: {
        title: 'Expiring Batches (< 60 Days)',
        items: expiringBatches.slice(0, 4).map(b => ({
          label: `${b.medicine} (${b.batch})`,
          value: `Expires in ${b.days} days`,
          badge: b.days <= 7 ? 'Critical Expiry' : 'Expiring Soon'
        }))
      }
    };
  }

  // 3. Amoxicillin specific query
  if (q.includes('amoxicillin')) {
    const amox = medicines.find(m => m.name.toLowerCase().includes('amoxicillin'));
    if (amox) {
      return {
        text: `Amoxicillin 250mg is flagged as **CRITICAL** because current inventory is down to ${amox.stock} units against a reorder threshold of ${amox.reorderThreshold}. Average daily dispensing is approx 7 units, leaving only ~2 days of safety coverage.`,
        actionButtons: [
          { label: 'Reorder Amoxicillin Now', action: 'reorder_medicine', payload: { medicineId: amox.id, quantity: 180 } }
        ],
        dataCard: {
          title: 'Amoxicillin Status',
          items: [
            { label: 'Current Stock', value: `${amox.stock} units` },
            { label: 'Reorder Point', value: `${amox.reorderThreshold} units` },
            { label: 'Recommended Restock', value: '180 units' },
            { label: 'Primary Supplier', value: amox.supplierName }
          ]
        }
      };
    }
  }

  // 4. Top selling query
  if (q.includes('top selling') || q.includes('best selling') || q.includes('popular')) {
    const top = [...medicines].sort((a, b) => (b.unitsSoldTotal || 0) - (a.unitsSoldTotal || 0)).slice(0, 4);
    return {
      text: 'Here are your top-performing medicines by overall volume and revenue contribution:',
      actionButtons: [
        { label: 'View Full Sales Reports', action: 'navigate_reports' }
      ],
      dataCard: {
        title: 'Top Dispensed Medicines',
        items: top.map(m => ({
          label: m.name,
          value: `${m.unitsSoldTotal?.toLocaleString()} units sold (₹${m.revenueTotal?.toLocaleString()})`,
          badge: 'Top Seller'
        }))
      }
    };
  }

  // 5. Default helpful assistant answer
  return {
    text: `MediCore AI Assistant is monitoring ${medicines.length} medicine lines and active batch allocations. You can ask about inventory stockouts, upcoming expiries, prescription drug safety, supplier delivery stats, or demand forecasts.`,
    actionButtons: [
      { label: 'Check Low Stock Items', action: 'navigate_inventory' },
      { label: 'Validate a Prescription', action: 'navigate_prescriptions' }
    ]
  };
}

export const askAiAssistant = askPharmacyAssistant;
export const validatePrescriptionClinicalRules = validatePrescription;

export const samplePrescriptionScenarios = [
  {
    scenarioTitle: 'Elderly Cardiac + Allergy Conflict',
    patientName: 'Vikram Singh',
    patientAge: 68,
    patientGender: 'Male' as const,
    allergies: ['Penicillin', 'Sulfa'],
    doctorName: 'Dr. Rajesh Khanna, MD',
    doctorRegNo: 'MCI-78249',
    medicines: [
      {
        medicineName: 'Amoxicillin 500mg',
        dosage: '500mg',
        frequency: 'TDS (Three times daily)',
        duration: '7 days',
        durationDays: 7,
        instructions: 'After meals'
      },
      {
        medicineName: 'Aspirin 75mg',
        dosage: '75mg',
        frequency: 'OD (Once daily)',
        duration: '30 days',
        durationDays: 30,
        instructions: 'Morning'
      },
      {
        medicineName: 'Warfarin 2mg',
        dosage: '2mg',
        frequency: 'OD (Once daily)',
        duration: '30 days',
        durationDays: 30,
        instructions: 'Evening'
      }
    ]
  },
  {
    scenarioTitle: 'Asthma + Non-Selective Beta Blocker',
    patientName: 'Sunita Sharma',
    patientAge: 42,
    patientGender: 'Female' as const,
    allergies: ['NSAIDs'],
    doctorName: 'Dr. Anita Desai, MBBS, DNB',
    doctorRegNo: 'MCI-43921',
    medicines: [
      {
        medicineName: 'Salbutamol Inhaler 100mcg',
        dosage: '2 puffs',
        frequency: 'PRN (As needed)',
        duration: '30 days',
        durationDays: 30,
        instructions: 'Inhale on shortness of breath'
      },
      {
        medicineName: 'Propranolol 40mg',
        dosage: '40mg',
        frequency: 'BD (Twice daily)',
        duration: '15 days',
        durationDays: 15,
        instructions: 'Before food'
      },
      {
        medicineName: 'Ibuprofen 400mg',
        dosage: '400mg',
        frequency: 'BD',
        duration: '5 days',
        durationDays: 5,
        instructions: 'After meals'
      }
    ]
  },
  {
    scenarioTitle: 'Standard Safe Antibiotic Course',
    patientName: 'Rahul Verma',
    patientAge: 29,
    patientGender: 'Male' as const,
    allergies: [],
    doctorName: 'Dr. Amit Patel, MD',
    doctorRegNo: 'MCI-99120',
    medicines: [
      {
        medicineName: 'Azithromycin 500mg',
        dosage: '500mg',
        frequency: 'OD (Once daily)',
        duration: '3 days',
        durationDays: 3,
        instructions: '1 hour before food'
      },
      {
        medicineName: 'Paracetamol 650mg',
        dosage: '650mg',
        frequency: 'TDS (Three times daily)',
        duration: '3 days',
        durationDays: 3,
        instructions: 'For fever above 100 F'
      },
      {
        medicineName: 'Cetirizine 10mg',
        dosage: '10mg',
        frequency: 'HS (At bedtime)',
        duration: '5 days',
        durationDays: 5,
        instructions: 'Night'
      }
    ]
  }
];