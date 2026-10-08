
import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { UserRole, ROLE_PAGES } from '../config/roles';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { ToastContainer } from '../components/common/ToastContainer';

// Pages
import { PharmacyFinderPage } from '../pages/PharmacyFinderPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MedicinesPage } from '../pages/MedicinesPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { AIInsightsPage } from '../pages/AIInsightsPage';
import { PrescriptionValidationPage } from '../pages/PrescriptionValidationPage';
import { GenericSuggestionsPage } from '../pages/GenericSuggestionsPage';
import { SuppliersPage } from '../pages/SuppliersPage';
import { CustomersPage } from '../pages/CustomersPage';
import { SalesPage } from '../pages/SalesPage';
import { PurchasesPage } from '../pages/PurchasesPage';
import { CustomerDashboardPage } from '../pages/customer/CustomerDashboardPage';
import { CustomerPurchasesPage } from '../pages/customer/CustomerPurchasesPage';
import { DemandForecastPage } from '../pages/DemandForecastPage';
import { ReportsPage } from '../pages/ReportsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';

// Modals
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';
import { AddEditMedicineModal } from '../components/modals/AddEditMedicineModal';
import { NewSalePosModal } from '../components/modals/NewSalePosModal';
import { CreatePurchaseOrderModal } from '../components/modals/CreatePurchaseOrderModal';
import { ReceiveStockModal } from '../components/modals/ReceiveStockModal';
import { MedicineDetailDrawer } from '../components/modals/MedicineDetailDrawer';
import { AiAssistantDrawer } from '../components/modals/AiAssistantDrawer';

import { Medicine } from '../types';

interface AppShellProps {
  role: UserRole;
}

export const AppShell: React.FC<AppShellProps> = ({ role }) => {
  const {
    activePage,
    isSearchOpen,
    setIsSearchOpen,
    isAddMedicineOpen,
    setIsAddMedicineOpen,
    isNewSaleOpen,
    setIsNewSaleOpen,
    isCreatePOOpen,
    setIsCreatePOOpen,
    selectedMedicineIdForDetails,
    setSelectedMedicineIdForDetails,
    selectedPOForReceiving,
    setSelectedPOForReceiving,
    isAiAssistantOpen,
    setIsAiAssistantOpen
  } = usePharmacy();

  const [isSidebarOpen, setIsSidebarOpen] =
    useState<boolean>(false);

  const [editingMedicine, setEditingMedicine] =
    useState<Medicine | null>(null);

  const handleOpenEditMedicine = (
    med: Medicine
  ) => {
    setEditingMedicine(med);
    setIsAddMedicineOpen(true);
  };

  const handleCloseAddEditMedicine = () => {
    setEditingMedicine(null);
    setIsAddMedicineOpen(false);
  };

  // Safety net: never render a page this role isn't allowed to see.
  const currentPage = ROLE_PAGES[role].includes(activePage)
    ? activePage
    : 'dashboard';

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return role === 'customer' ? <CustomerDashboardPage /> : <DashboardPage />;

      case 'medicines':
        return (
          <MedicinesPage
            onEditMedicine={
              handleOpenEditMedicine
            }
          />
        );

      case 'inventory':
        return <InventoryPage />;

      case 'categories':
        return <CategoriesPage />;

      case 'prescriptions':
        return <PrescriptionValidationPage />;

      case 'generics':
        return <GenericSuggestionsPage />;

      case 'ai-insights':
        return <AIInsightsPage />;

      case 'suppliers':
        return <SuppliersPage />;

      /*
       * CUSTOMER PHARMACY RECOMMENDATION
       *
       * This connects the Sidebar navigation item:
       * "Find Pharmacy"
       *
       * to the PharmacyFinderPage component.
       */
      case 'pharmacy-finder':
        return <PharmacyFinderPage />;

      case 'customers':
        return <CustomersPage />;

      case 'sales':
        return <SalesPage />;

      case 'purchases':
        return role === 'customer' ? <CustomerPurchasesPage /> : <PurchasesPage />;

      case 'forecast':
        return <DemandForecastPage />;

      case 'reports':
        return <ReportsPage />;

      case 'notifications':
        return <NotificationsPage />;

      case 'settings':
        return <SettingsPage />;

      default:
        return role === 'customer' ? <CustomerDashboardPage /> : <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">

      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isSidebarOpen}
        setIsMobileOpen={setIsSidebarOpen}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <Topbar
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
        />

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">

            {/* 
             * The active page is rendered here.
             *
             * When activePage === "pharmacy-finder",
             * PharmacyFinderPage will appear here.
             */}
            {renderActivePage()}

          </div>
        </main>
      </div>

      {/* =====================================================
          GLOBAL MODALS & DRAWERS
          ===================================================== */}

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() =>
          setIsSearchOpen(false)
        }
      />

      <AddEditMedicineModal
        isOpen={isAddMedicineOpen}
        onClose={
          handleCloseAddEditMedicine
        }
        medicineToEdit={
          editingMedicine
        }
      />

      <NewSalePosModal
        isOpen={isNewSaleOpen}
        onClose={() =>
          setIsNewSaleOpen(false)
        }
      />

      <CreatePurchaseOrderModal
        isOpen={isCreatePOOpen}
        onClose={() =>
          setIsCreatePOOpen(false)
        }
      />

      <ReceiveStockModal
        isOpen={
          !!selectedPOForReceiving
        }
        onClose={() =>
          setSelectedPOForReceiving(null)
        }
        purchaseOrder={
          selectedPOForReceiving
        }
      />

      <MedicineDetailDrawer
        medicineId={
          selectedMedicineIdForDetails
        }
        onClose={() =>
          setSelectedMedicineIdForDetails(null)
        }
        onEdit={
          handleOpenEditMedicine
        }
      />

      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />

      {/* Notification Toast System */}
      <ToastContainer />

    </div>
  );
};
