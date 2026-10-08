import React, { useState } from 'react';
import { usePharmacy, PageRoute } from '../../context/PharmacyContext';
import {
  LayoutDashboard,
  Pill,
  Boxes,
  Layers,
  Sparkles,
  FileCheck2,
  RefreshCw,
  Truck,
  Users,
  Receipt,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    id: PageRoute;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeVariant?: 'danger' | 'warning' | 'info' | 'ai';
  }[];
}

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const {
    activePage,
    setActivePage,
    lowStockMedicinesCount,
    expiringSoonBatchesCount,
    pendingPurchaseOrdersCount,
    unreadNotificationsCount,
    insights
  } = usePharmacy();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const criticalInsightsCount = insights.filter(i => i.priority === 'CRITICAL' && !i.isDismissed).length;
  const inventoryIssuesCount = lowStockMedicinesCount + expiringSoonBatchesCount;

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Catalog',
      items: [
        { id: 'medicines', label: 'Medicines', icon: Pill },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Boxes,
          badgeCount: inventoryIssuesCount > 0 ? inventoryIssuesCount : undefined,
          badgeVariant: 'warning'
        },
        { id: 'categories', label: 'Categories', icon: Layers }
      ]
    },
    {
      title: 'AI & Safety',
      items: [
        {
          id: 'ai-insights',
          label: 'AI Insights',
          icon: Sparkles,
          badgeCount: criticalInsightsCount > 0 ? criticalInsightsCount : undefined,
          badgeVariant: 'ai'
        },
        { id: 'prescriptions', label: 'Prescription Validation', icon: FileCheck2 },
        { id: 'generics', label: 'Generic Suggestions', icon: RefreshCw }
      ]
    },
    {
      title: 'Relationships',
      items: [
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
        { id: 'customers', label: 'Customers', icon: Users }
      ]
    },
    {
      title: 'Transactions',
      items: [
        { id: 'sales', label: 'Sales (POS)', icon: Receipt },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: ShoppingCart,
          badgeCount: pendingPurchaseOrdersCount > 0 ? pendingPurchaseOrdersCount : undefined,
          badgeVariant: 'info'
        }
      ]
    },
    {
      title: 'Insights',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp }
      ]
    },
    {
      title: 'System',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badgeCount: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeVariant: 'danger'
        },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  const handleNavClick = (pageId: PageRoute) => {
    setActivePage(pageId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base text-slate-900 tracking-tight block truncate">
                  MediCore
                </span>
                <span className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider block">
                  AI Smart Pharmacy
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-blue-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}

                      {/* Badge counter */}
                      {item.badgeCount !== undefined && (
                        <span
                          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-100 text-rose-700'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : item.badgeVariant === 'ai'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                          } ${isCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-white' : ''}`}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Quick Status Pill (Bottom) */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-200">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border border-indigo-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-indigo-950 truncate">Decision Engine Active</p>
                <p className="text-[10px] text-indigo-600">Prescription Safety & Demand AI</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-200 flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
