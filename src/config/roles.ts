// Role definitions and per-role page access for the prototype.

import type { PageRoute } from '../context/PharmacyContext';

export type UserRole = 'customer' | 'pharmacist';

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  pharmacist: 'Pharmacist'
};

// Every page in the app. Pharmacists can open all of them.
export const ALL_PAGES: PageRoute[] = [
  'dashboard',
  'medicines',
  'inventory',
  'categories',
  'ai-insights',
  'prescriptions',
  'generics',
  'suppliers',
  'customers',
  'pharmacy-finder',
  'sales',
  'purchases',
  'reports',
  'forecast',
  'notifications',
  'settings'
];

// Customers get a deliberately small set: their own dashboard, their own
// purchases, Find Pharmacy and prescription validation.
// To give customers another page later, add its route here.
export const ROLE_PAGES: Record<UserRole, PageRoute[]> = {
  pharmacist: ALL_PAGES,
  customer: ['dashboard', 'purchases', 'pharmacy-finder', 'prescriptions']
};
