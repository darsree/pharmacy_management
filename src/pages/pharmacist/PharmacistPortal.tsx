import React from 'react';
import { PharmacyProvider } from '../../context/PharmacyContext';
import { AppShell } from '../../layouts/AppShell';
import { ROLE_PAGES } from '../../config/roles';

// Pharmacist workspace: every page in the app.
export const PharmacistPortal: React.FC = () => (
  <PharmacyProvider allowedPages={ROLE_PAGES.pharmacist}>
    <AppShell role="pharmacist" />
  </PharmacyProvider>
);
