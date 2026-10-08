import React from 'react';
import { PharmacyProvider } from '../../context/PharmacyContext';
import { CustomerDataProvider } from '../../context/CustomerDataContext';
import { AppShell } from '../../layouts/AppShell';
import { ROLE_PAGES } from '../../config/roles';

// Customer workspace: own dashboard, own purchases, Find Pharmacy and
// prescription validation. PharmacyProvider still supplies shared services
// (toasts, navigation, pharmacy finder data); the customer's personal data
// lives in CustomerDataProvider.
export const CustomerPortal: React.FC = () => (
  <PharmacyProvider allowedPages={ROLE_PAGES.customer}>
    <CustomerDataProvider>
      <AppShell role="customer" />
    </CustomerDataProvider>
  </PharmacyProvider>
);
