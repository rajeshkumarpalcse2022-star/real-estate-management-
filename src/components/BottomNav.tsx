/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  HardHat, 
  Users, 
  Wrench, 
  Building2, 
  DollarSign, 
  Building,
  Boxes,
  Truck,
  Receipt,
  Database,
  UserCheck,
  ShieldCheck,
  LayoutGrid,
  X,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface BottomNavProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isBasicPlan?: boolean;
}

interface NavTabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  desc?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  isBasicPlan = false,
}) => {
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  // Complete list of tabs for current role
  const getAllTabsForRole = (role: UserRole): NavTabItem[] => {
    let list: NavTabItem[] = [];
    switch (role) {
      case 'Admin':
        list = [
          { id: 'overview', label: 'Executive Overview', shortLabel: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, desc: 'Portfolio metrics & financials' },
          { id: 'crm', label: 'Leads & CRM', shortLabel: 'CRM', icon: <UserCheck className="w-5 h-5" />, desc: 'Buyer pipeline & client conversion' },
          { id: 'clients', label: 'Client Directory', shortLabel: 'Clients', icon: <Users className="w-5 h-5" />, desc: 'Corporate clients & billing' },
          { id: 'projects', label: 'Projects & Construction', shortLabel: 'Projects', icon: <HardHat className="w-5 h-5" />, desc: 'Active construction sites & milestones' },
          { id: 'properties', label: 'Built Spaces & Apts', shortLabel: 'Properties', icon: <Building2 className="w-5 h-5" />, desc: 'Apartment units & occupancy logs' },
          { id: 'billing', label: 'Property Billing', shortLabel: 'Billing', icon: <Receipt className="w-5 h-5" />, desc: 'Tenant billing & milestone invoices' },
          { id: 'employees', label: 'Employee Roster', shortLabel: 'Staff', icon: <Users className="w-5 h-5" />, desc: 'Engineers, staff & contractors' },
          { id: 'assets', label: 'Assets & Machinery', shortLabel: 'Machinery', icon: <Wrench className="w-5 h-5" />, desc: 'Heavy fleet & service registry' },
          { id: 'materials', label: 'Materials & Stocks', shortLabel: 'Materials', icon: <Boxes className="w-5 h-5" />, desc: 'Stock inventory & warehouses' },
          { id: 'vendors', label: 'Logistics & Vendors', shortLabel: 'Vendors', icon: <Truck className="w-5 h-5" />, desc: 'Material suppliers & logistics' },
          { id: 'expenses', label: 'Expenses & Ledger', shortLabel: 'Expenses', icon: <DollarSign className="w-5 h-5" />, desc: 'Capital expense signoffs' },
        ];
        break;
      case 'ProjectManager':
        list = [
          { id: 'projects', label: 'Projects & Construction', shortLabel: 'Projects', icon: <HardHat className="w-5 h-5" />, desc: 'Active construction sites' },
          { id: 'assets', label: 'Assigned Machinery', shortLabel: 'Machinery', icon: <Wrench className="w-5 h-5" />, desc: 'Heavy fleet & maintenance' },
          { id: 'materials', label: 'Materials & Stocks', shortLabel: 'Materials', icon: <Boxes className="w-5 h-5" />, desc: 'Inventory stocks' },
          { id: 'vendors', label: 'Logistics & Vendors', shortLabel: 'Vendors', icon: <Truck className="w-5 h-5" />, desc: 'Suppliers & logistics' },
        ];
        break;
      case 'HRManager':
        list = [
          { id: 'employees', label: 'Employee Directory', shortLabel: 'Staff', icon: <Users className="w-5 h-5" />, desc: 'Staff directory & profiles' },
          { id: 'clients', label: 'Client Directory', shortLabel: 'Clients', icon: <Users className="w-5 h-5" />, desc: 'Corporate clients & relationships' },
        ];
        break;
      case 'PropertyManager':
        list = [
          { id: 'crm', label: 'Leads & CRM', shortLabel: 'CRM', icon: <UserCheck className="w-5 h-5" />, desc: 'Buyer pipeline & conversion' },
          { id: 'clients', label: 'Client Directory', shortLabel: 'Clients', icon: <Users className="w-5 h-5" />, desc: 'Client leases & bill assignment' },
          { id: 'properties', label: 'Built Properties & Apts', shortLabel: 'Properties', icon: <Building2 className="w-5 h-5" />, desc: 'Inventory units & leasing' },
          { id: 'billing', label: 'Property Billing', shortLabel: 'Billing', icon: <Receipt className="w-5 h-5" />, desc: 'Rent & sales invoicing' },
        ];
        break;
      case 'FinancialOfficer':
        list = [
          { id: 'expenses', label: 'Expenses Sign-off', shortLabel: 'Expenses', icon: <DollarSign className="w-5 h-5" />, desc: 'Expense approvals & ledger' },
          { id: 'billing', label: 'Property Billing', shortLabel: 'Billing', icon: <Receipt className="w-5 h-5" />, desc: 'Invoices & revenue recovery' },
          { id: 'clients', label: 'Client Directory', shortLabel: 'Clients', icon: <Users className="w-5 h-5" />, desc: 'Client billing accounts' },
        ];
        break;
      case 'Client':
        list = [
          { id: 'client-dashboard', label: 'Client Workspace', shortLabel: 'Workspace', icon: <Building className="w-5 h-5" />, desc: 'My property & maintenance' },
          { id: 'billing', label: 'My Property Bills', shortLabel: 'Bills', icon: <Receipt className="w-5 h-5" />, desc: 'Invoice payments' },
        ];
        break;
      case 'SuperAdmin':
        list = [
          { id: 'super-admin', label: 'Platform Console', shortLabel: 'Console', icon: <ShieldCheck className="w-5 h-5" />, desc: 'SaaS tenants & telemetry' },
          { id: 'crm', label: 'Leads & CRM', shortLabel: 'CRM', icon: <UserCheck className="w-5 h-5" />, desc: 'Global prospective leads' },
        ];
        break;
      default:
        list = [];
    }

    if (isBasicPlan) {
      return list.filter(tab => tab.id !== 'projects' && tab.id !== 'materials' && tab.id !== 'vendors');
    }
    return list;
  };

  const allTabs = getAllTabsForRole(currentRole);

  // If there are more than 5 tabs, show top 4 primary tabs on the bottom bar + 1 "More" button
  const hasMore = allTabs.length > 5;
  const bottomBarTabs = hasMore ? allTabs.slice(0, 4) : allTabs;
  const moreTabs = hasMore ? allTabs.slice(4) : [];

  // Check if current active tab is inside the "More" drawer
  const isActiveInMore = moreTabs.some(t => t.id === activeTab);

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    setShowMoreDrawer(false);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. FIXED APP BOTTOM NAVIGATION BAR (Mobile & Tablet)         */}
      {/* ============================================================ */}
      <nav 
        id="app-mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#111114]/95 backdrop-blur-xl border-t border-zinc-800 text-zinc-400 shadow-2xl safe-area-inset-bottom"
        aria-label="Mobile and Tablet App Navigation"
      >
        <div className="max-w-md md:max-w-xl mx-auto px-2 flex items-center justify-around h-16">
          {bottomBarTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${
                  isActive 
                    ? 'text-emerald-400 font-bold' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {/* Active Indicator Top Glow Pill */}
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}

                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-zinc-400 group-hover:scale-105'}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-[64px] font-sans">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}

          {/* "More" Button if role has additional tabs */}
          {hasMore && (
            <button
              onClick={() => setShowMoreDrawer(true)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${
                isActiveInMore 
                  ? 'text-emerald-400 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActiveInMore && (
                <span className="absolute top-0 w-8 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}

              <div className={`p-1 rounded-lg transition-transform ${isActiveInMore ? 'scale-110 text-emerald-400' : 'text-zinc-400 group-hover:scale-105'}`}>
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-[64px] font-sans flex items-center gap-0.5">
                More
                {isActiveInMore && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ============================================================ */}
      {/* 2. APP ACTION SHEET / "MORE" DRAWER                          */}
      {/* ============================================================ */}
      {showMoreDrawer && (
        <div 
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowMoreDrawer(false)}
        >
          {/* Drawer Body */}
          <div 
            className="bg-[#111114] border-t border-zinc-800 rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl safe-area-inset-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle & Header */}
            <div className="flex flex-col items-center gap-2">
              <span className="w-12 h-1.5 bg-zinc-700/80 rounded-full" />
              <div className="w-full flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                    D
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">All App Modules</h3>
                    <p className="text-[11px] text-zinc-500 font-sans">
                      Select any workspace module to navigate
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMoreDrawer(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {allTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-white shadow-md'
                        : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500 text-zinc-950 font-bold' : 'bg-zinc-900 text-zinc-400'}`}>
                        {tab.icon}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {tab.label}
                        </div>
                        {tab.desc && (
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {tab.desc}
                          </div>
                        )}
                      </div>
                    </div>

                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
