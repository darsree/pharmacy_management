import React, { useState } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { InventoryPage } from './pages/InventoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { PrescriptionValidationPage } from './pages/PrescriptionValidationPage';
import { GenericSuggestionsPage } from './pages/GenericSuggestionsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { DemandForecastPage } from './pages/DemandForecastPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

// Modals
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { AddEditMedicineModal } from './components/modals/AddEditMedicineModal';
import { NewSalePosModal } from './components/modals/NewSalePosModal';
import { CreatePurchaseOrderModal } from './components/modals/CreatePurchaseOrderModal';
import { ReceiveStockModal } from './components/modals/ReceiveStockModal';
import { MedicineDetailDrawer } from './components/modals/MedicineDetailDrawer';
import { AiAssistantDrawer } from './components/modals/AiAssistantDrawer';
import { Medicine } from './types';

const PharmacyAppContent: React.FC = () => {
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
    setSelectedPOForReceiving
  } = usePharmacy();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  const handleOpenEditMedicine = (med: Medicine) => {
    setEditingMedicine(med);
    setIsAddMedicineOpen(true);
  };

  const handleCloseAddEditMedicine = () => {
    setEditingMedicine(null);
    setIsAddMedicineOpen(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'medicines':
        return <MedicinesPage onEditMedicine={handleOpenEditMedicine} />;
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
      case 'customers':
        return <CustomersPage />;
      case 'sales':
        return <SalesPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'forecast':
        return <DemandForecastPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
        />

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <AddEditMedicineModal
        isOpen={isAddMedicineOpen}
        onClose={handleCloseAddEditMedicine}
        medicineToEdit={editingMedicine}
      />

      <NewSalePosModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
      />

      <CreatePurchaseOrderModal
        isOpen={isCreatePOOpen}
        onClose={() => setIsCreatePOOpen(false)}
      />

      <ReceiveStockModal
        isOpen={!!selectedPOForReceiving}
        onClose={() => setSelectedPOForReceiving(null)}
        purchaseOrder={selectedPOForReceiving}
      />

      <MedicineDetailDrawer
        medicineId={selectedMedicineIdForDetails}
        onClose={() => setSelectedMedicineIdForDetails(null)}
        onEdit={handleOpenEditMedicine}
      />

      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />

      {/* Notification Toast System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <PharmacyAppContent />
    </PharmacyProvider>
  );
}
