/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  HardHat, 
  Users, 
  Wrench, 
  Building2, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Building,
  Boxes,
  Truck,
  Receipt,
  Database,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isBasicPlan?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  isBasicPlan = false,
}) => {
  // Determine available tabs based on active role
  const getTabsForRole = (role: UserRole) => {
    let allTabs = [];
    switch (role) {
      case 'Admin':
        allTabs = [
          { id: 'overview', label: 'Executive Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'crm', label: 'Leads & CRM', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'clients', label: 'Client Directory', icon: <Users className="w-4 h-4" /> },
          { id: 'projects', label: 'Projects & Construction', icon: <HardHat className="w-4 h-4" /> },
          { id: 'employees', label: 'Employee Roster', icon: <Users className="w-4 h-4" /> },
          { id: 'assets', label: 'Assets & Machinery', icon: <Wrench className="w-4 h-4" /> },
          { id: 'materials', label: 'Materials & Stocks', icon: <Boxes className="w-4 h-4" /> },
          { id: 'vendors', label: 'Logistics & Vendors', icon: <Truck className="w-4 h-4" /> },
          { id: 'properties', label: 'Built Spaces & Apts', icon: <Building2 className="w-4 h-4" /> },
          { id: 'expenses', label: 'Expenses & Ledger', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'billing', label: 'Property Billing', icon: <Receipt className="w-4 h-4" /> },
        ];
        break;
      case 'ProjectManager':
        allTabs = [
          { id: 'projects', label: 'Projects & Construction', icon: <HardHat className="w-4 h-4" /> },
          { id: 'assets', label: 'Assigned Machinery', icon: <Wrench className="w-4 h-4" /> },
          { id: 'materials', label: 'Materials & Stocks', icon: <Boxes className="w-4 h-4" /> },
          { id: 'vendors', label: 'Logistics & Vendors', icon: <Truck className="w-4 h-4" /> },
        ];
        break;
      case 'HRManager':
        allTabs = [
          { id: 'employees', label: 'Employee Directory', icon: <Users className="w-4 h-4" /> },
          { id: 'clients', label: 'Client Directory', icon: <Users className="w-4 h-4" /> },
        ];
        break;
      case 'PropertyManager':
        allTabs = [
          { id: 'crm', label: 'Leads & CRM', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'clients', label: 'Client Directory', icon: <Users className="w-4 h-4" /> },
          { id: 'properties', label: 'Built Properties & Apts', icon: <Building2 className="w-4 h-4" /> },
          { id: 'billing', label: 'Property Billing', icon: <Receipt className="w-4 h-4" /> },
        ];
        break;
      case 'FinancialOfficer':
        allTabs = [
          { id: 'expenses', label: 'Expenses Sign-off', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'billing', label: 'Property Billing', icon: <Receipt className="w-4 h-4" /> },
          { id: 'clients', label: 'Client Directory', icon: <Users className="w-4 h-4" /> },
        ];
        break;
      case 'Client':
        allTabs = [
          { id: 'client-dashboard', label: 'Client Workspace', icon: <Building className="w-4 h-4" /> },
          { id: 'billing', label: 'My Property Bills', icon: <Receipt className="w-4 h-4" /> },
        ];
        break;
      case 'SuperAdmin':
        allTabs = [
          { id: 'super-admin', label: 'Platform Console', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'crm', label: 'Leads & CRM', icon: <UserCheck className="w-4 h-4" /> },
        ];
        break;
      default:
        allTabs = [];
    }

    if (isBasicPlan) {
      return allTabs.filter(tab => tab.id !== 'projects' && tab.id !== 'materials' && tab.id !== 'vendors');
    }
    return allTabs;
  };

  const tabs = getTabsForRole(currentRole);

  return (
    <aside 
      className={`hidden lg:flex bg-[#111114] border-r border-zinc-800 text-zinc-400 h-full flex-col justify-between transition-all duration-300 relative shrink-0 overflow-y-auto custom-scrollbar select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3 flex flex-col space-y-3">
        {/* Navigation Section Group */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 pt-1">
            Platform Modules
          </p>
        )}

        {/* Dynamic Navigation Tabs List */}
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
                title={tab.label}
              >
                <span className={`${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {tab.icon}
                </span>
                {!collapsed && <span className="truncate">{tab.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-zinc-850 space-y-4">
        {/* Secure Role Badge */}
        {!collapsed && (
          <div className="bg-[#09090b] p-2.5 rounded-lg border border-zinc-800/80 text-center flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-zinc-500 font-mono leading-none">VERIFIED ACCESS</p>
              <p className="text-[11px] font-bold text-white mt-1 uppercase tracking-wide">
                {currentRole === 'ProjectManager' ? 'Const. Mgr' : currentRole === 'FinancialOfficer' ? 'Fin. Officer' : currentRole}
              </p>
            </div>
          </div>
        )}

        {/* Collapse Toggle Switch */}
        <button
          onClick={onToggleCollapse}
          className="w-full py-1.5 flex items-center justify-center bg-zinc-800/60 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
