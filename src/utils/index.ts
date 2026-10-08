// MediCore Utility Functions

import { Medicine, Batch, BatchExpiryStatus, StockStatus, SaleItem } from '../types';

/**
 * Format currency in Indian Rupee format (e.g. ₹84,920.00)
 */
export function formatCurrency(amount: number, showDecimals: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Format date string into human-readable Indian format (DD MMM YYYY)
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
}

export const formatShortDate = formatDate;
export const formatDateTime = (d: string | undefined) => formatDate(d);

/**
 * Calculate difference in calendar days from today
 */
export function getDaysRemaining(expiryDateString: string): number {
  if (!expiryDateString) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateString);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const calculateDaysRemaining = getDaysRemaining;

/**
 * Compute batch expiry status based on days remaining
 */
export function getBatchExpiryStatus(expiryDateString: string): BatchExpiryStatus {
  const days = getDaysRemaining(expiryDateString);
  if (days <= 0) return 'expired';
  if (days <= 7) return 'expiring_7';
  if (days <= 30) return 'expiring_30';
  if (days <= 60) return 'expiring_60';
  return 'healthy';
}

/**
 * Compute medicine stock status based on prompt specifications:
 * if stock <= 0: Out of Stock
 * else if stock < 40% of reorder threshold: Critical
 * else if stock < reorder threshold: Low Stock
 * else: In Stock
 */
export function computeStockStatus(stock: number, reorderThreshold: number): StockStatus {
  if (stock <= 0) return 'out_of_stock';
  const criticalThreshold = Math.max(1, Math.round(reorderThreshold * 0.4));
  if (stock <= criticalThreshold) return 'critical';
  if (stock <= reorderThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Expiry-First (FIFO) Allocation Strategy
 * Sorts active batches by earliest valid expiry date.
 * Strictly prevents allocating expired batches.
 */
export function allocateBatchesExpiryFirst(
  medicine: Medicine,
  quantityRequested: number
): {
  success: boolean;
  allocations: Array<{
    batch: Batch;
    allocatedQty: number;
    unitPrice: number;
    subtotal: number;
  }>;
  errorMessage?: string;
} {
  // Filter out expired batches (days remaining <= 0)
  const validBatches = medicine.batches
    .filter(b => b.quantity > 0 && getDaysRemaining(b.expiryDate) > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const totalValidStock = validBatches.reduce((acc, b) => acc + b.quantity, 0);

  if (totalValidStock < quantityRequested) {
    if (medicine.stock >= quantityRequested && totalValidStock < quantityRequested) {
      return {
        success: false,
        allocations: [],
        errorMessage: `Cannot dispense: ${quantityRequested} units requested, but valid non-expired stock is only ${totalValidStock} units (${medicine.stock - totalValidStock} units in expired batches).`
      };
    }
    return {
      success: false,
      allocations: [],
      errorMessage: `Insufficient stock for ${medicine.name}. Available: ${totalValidStock} units, Requested: ${quantityRequested} units.`
    };
  }

  let remainingToAllocate = quantityRequested;
  const allocations: Array<{
    batch: Batch;
    allocatedQty: number;
    unitPrice: number;
    subtotal: number;
  }> = [];

  for (const batch of validBatches) {
    if (remainingToAllocate <= 0) break;
    const take = Math.min(batch.quantity, remainingToAllocate);
    
    // Check if clearance discount applies
    let effectivePrice = medicine.sellingPrice;
    if (batch.clearanceDiscount && batch.clearanceDiscount > 0) {
      effectivePrice = effectivePrice * (1 - batch.clearanceDiscount / 100);
    }

    allocations.push({
      batch,
      allocatedQty: take,
      unitPrice: effectivePrice,
      subtotal: take * effectivePrice
    });

    remainingToAllocate -= take;
  }

  return {
    success: true,
    allocations
  };
}

/**
 * Export data array to CSV file and trigger browser download
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate unique IDs
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}
