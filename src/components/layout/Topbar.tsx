import React, { useState, useRef, useEffect } from 'react';
import { usePharmacy, PageRoute } from '../../context/PharmacyContext';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sparkles,
  ChevronDown,
  User,
  Settings as SettingsIcon,
  RotateCcw,
  Receipt,
  Pill,
  ShoppingCart,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '../common/Button';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenGlobalSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, onOpenGlobalSearch }) => {
  const {
    activePage,
    setActivePage,
    settings,
    unreadNotificationsCount,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setIsNewSaleOpen,
    setIsAddMedicineOpen,
    setIsCreatePOOpen,
    setIsAiAssistantOpen,
    resetToDemoData
  } = usePharmacy();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const quickAddRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setIsQuickAddOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles: Record<PageRoute, { title: string; category: string }> = {
    dashboard: { title: 'Dashboard', category: 'Overview' },
    medicines: { title: 'Medicines Catalog', category: 'Catalog' },
    inventory: { title: 'Inventory & Batches', category: 'Catalog' },
    categories: { title: 'Medicine Categories', category: 'Catalog' },
    'ai-insights': { title: 'AI Pharmacy Insights', category: 'AI & Safety' },
    prescriptions: { title: 'Prescription Safety Validation', category: 'AI & Safety' },
    generics: { title: 'Generic Medicine Suggestions', category: 'AI & Safety' },
    suppliers: { title: 'Suppliers Directory', category: 'Relationships' },
    customers: { title: 'Customer Records', category: 'Relationships' },
    sales: { title: 'Sales & POS Invoicing', category: 'Transactions' },
    purchases: { title: 'Purchase Orders', category: 'Transactions' },
    reports: { title: 'Analytics & Financial Reports', category: 'Insights' },
    forecast: { title: 'AI Demand Forecast', category: 'Insights' },
    notifications: { title: 'Notification Center', category: 'System' },
    settings: { title: 'Pharmacy Settings', category: 'System' }
  };

  const currentInfo = pageTitles[activePage] || { title: 'MediCore', category: 'Pharmacy' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>MediCore</span>
            <span>/</span>
            <span className="text-slate-500">{currentInfo.category}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {currentInfo.title}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Input */}
      <div className="hidden md:flex flex-1 max-w-md mx-2">
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="w-full h-9.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="truncate">Search medicines, batches, suppliers, invoices...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, AI Assistant, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* MediCore AI Assistant Floating Trigger */}
        <button
          type="button"
          onClick={() => setIsAiAssistantOpen(true)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200/80 text-indigo-700 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="hidden sm:inline">MediCore AI</span>
        </button>

        {/* Quick Add Menu */}
        <div className="relative" ref={quickAddRef}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            icon={<Plus className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Quick Add</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </Button>

          {isQuickAddOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setIsNewSaleOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold">New Sale (POS)</p>
                  <p className="text-[10px] text-slate-400">Dispense medicines & invoice</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setIsAddMedicineOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Pill className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold">Add Medicine</p>
                  <p className="text-[10px] text-slate-400">New catalog listing</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setIsCreatePOOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold">Purchase Order</p>
                  <p className="text-[10px] text-slate-400">Order from supplier</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setActivePage('prescriptions');
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold">Validate Prescription</p>
                  <p className="text-[10px] text-slate-400">AI drug safety check</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-800">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full">
                      {unreadNotificationsCount} unread
                    </span>
                  )}
                </div>
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.linkRoute) setActivePage(n.linkRoute as PageRoute);
                      setIsNotificationsOpen(false);
                    }}
                    className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                      !n.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.priority === 'critical' ? (
                        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ) : n.priority === 'warning' ? (
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <button
                  onClick={() => {
                    setActivePage('notifications');
                    setIsNotificationsOpen(false);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img
              src={settings.profile.avatarUrl}
              alt={settings.profile.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                {settings.profile.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-tight">
                {settings.profile.role.split('&')[0]}
              </p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{settings.profile.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{settings.profile.email}</p>
              </div>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setActivePage('settings');
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                Pharmacy Settings
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  resetToDemoData();
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                Reset Demo Data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
