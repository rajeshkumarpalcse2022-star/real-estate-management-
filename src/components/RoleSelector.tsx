/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserRole, SystemNotification } from '../types';
import { 
  Shield, 
  HardHat, 
  Users, 
  Building2, 
  DollarSign, 
  LogOut, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown,
  ChevronRight,
  Bell,
  BellRing,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Sun,
  Moon,
  Search,
  Command,
  UserCheck,
  Building,
  Wrench,
  Boxes,
  Truck,
  Receipt,
  LayoutDashboard
} from 'lucide-react';

interface RoleSelectorProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
  };
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
  pendingExpensesCount: number;
  availableApartmentsCount: number;
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onNavigateToTab?: (tab: string) => void;
  activeTab?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentUser,
  onLogout,
  onRoleChange,
  pendingExpensesCount,
  availableApartmentsCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  theme = 'dark',
  onToggleTheme,
  onNavigateToTab,
  activeTab = 'overview',
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Global ⌘K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
        setShowUserDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'Admin',
      label: 'Executive Admin',
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: 'Global portfolio oversight, financial summaries, and cross-departmental analytics.',
    },
    {
      value: 'ProjectManager',
      label: 'Project & Construction',
      icon: <HardHat className="w-3.5 h-3.5" />,
      desc: 'Construction phases, schedules, safety audits, and project site progress tracking.',
    },
    {
      value: 'HRManager',
      label: 'HR & Employee Manager',
      icon: <Users className="w-3.5 h-3.5" />,
      desc: 'Staff rosters, subcontractor logs, wage sheets, and contractor rosters.',
    },
    {
      value: 'PropertyManager',
      label: 'Property & Spaces',
      icon: <Building2 className="w-3.5 h-3.5" />,
      desc: 'Already built apartment units, leasing details, rental status, and occupancy logs.',
    },
    {
      value: 'FinancialOfficer',
      label: 'Financial Officer',
      icon: <DollarSign className="w-3.5 h-3.5" />,
      desc: 'Expense ledger accounts, capital investments, and invoice approval workflows.',
    },
    {
      value: 'SuperAdmin',
      label: 'SaaS Super Admin',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      desc: 'SaaS Platform management, company purchases, admin creation, and global platform telemetry.',
    },
    {
      value: 'Client',
      label: 'Client Workspace',
      icon: <Building className="w-3.5 h-3.5" />,
      desc: 'Property units, assigned invoices, and maintenance tickets.',
    },
  ];



  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Admin': return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'ProjectManager': return <HardHat className="w-3.5 h-3.5 text-cyan-400" />;
      case 'HRManager': return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PropertyManager': return <Building2 className="w-3.5 h-3.5 text-fuchsia-400" />;
      case 'FinancialOfficer': return <DollarSign className="w-3.5 h-3.5 text-rose-400" />;
      case 'SuperAdmin': return <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />;
      case 'Client': return <Users className="w-3.5 h-3.5 text-blue-400" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const activeRoleDetails = rolesList.find((r) => r.value === currentUser.role);

  const formattedTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <header className="h-14 w-full border-b border-zinc-800 bg-[#111114]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 select-none z-30 transition-colors">
      {/* ============================================================ */}
      {/* 1. LEFT: SOFTWARE BRANDING                                  */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Software Identity Brand (DOMUS OS) */}
        <div 
          onClick={() => onNavigateToTab?.('overview')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          title="DOMUS OS Enterprise Studio"
        >
          <div className="w-7 h-7 bg-white text-zinc-950 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            D
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="font-bold text-xs tracking-tight text-white block font-sans">
              DOMUS OS
            </span>
            <span className="text-[9px] text-zinc-500 font-mono mt-0.5 hidden sm:inline">
              Enterprise Studio
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. RIGHT: SEARCH (⌘K), THEME TOGGLE, NOTIFICATIONS & AVATAR  */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Center/Right: Search Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setShowCommandPalette(true)}
          className="flex items-center justify-between w-40 sm:w-56 md:w-64 px-2.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors cursor-pointer group shadow-sm text-left"
          title="Search workspace... (⌘K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">Search workspace...</span>
          </div>
          <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 px-1.5 py-0.5 rounded pointer-events-none hidden sm:inline">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            )}
          </button>
        )}

        {/* Notifications Icon Button & Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className={`relative p-1.5 sm:p-2 rounded-lg border text-xs cursor-pointer transition-colors shrink-0 ${
              showNotifications 
                ? 'bg-zinc-800 text-white border-zinc-700' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850 hover:text-white hover:border-zinc-700'
            }`}
            title="System Notifications"
          >
            {notifications.some(n => !n.read) ? (
              <>
                <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-[#111114]">
                  {notifications.filter(n => !n.read).length}
                </span>
              </>
            ) : (
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in text-left">
              {/* Header */}
              <div className="p-3 bg-[#141417] border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Security & Ops Alerts
                </span>
                <div className="flex items-center gap-2">
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={() => onMarkAllAsRead()}
                      className="text-[10px] text-zinc-400 hover:text-emerald-400 font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark Read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => onClearNotifications()}
                      className="text-[10px] text-zinc-500 hover:text-rose-400 font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Items */}
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-850">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    No security or operational alerts logged.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const getNotificationIcon = (type: string) => {
                      switch (type) {
                        case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
                        case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
                        case 'info': return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
                        default: return <Bell className="w-4 h-4 text-zinc-500 shrink-0" />;
                      }
                    };

                    return (
                      <div 
                        key={n.id} 
                        onClick={() => !n.read && onMarkAsRead(n.id)}
                        className={`p-3.5 flex gap-2.5 transition-colors cursor-pointer ${
                          n.read ? 'bg-transparent hover:bg-zinc-900/40' : 'bg-amber-950/10 hover:bg-amber-950/20 border-l-2 border-amber-500'
                        }`}
                      >
                        <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-zinc-200 truncate">{n.title}</span>
                            {!n.read && (
                              <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />
                            )}
                          </div>
                          <p className={`text-[11px] mt-0.5 leading-relaxed break-words ${n.read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            {n.message}
                          </p>
                          <span className="text-[9px] font-mono text-zinc-600 mt-1 block">
                            {formattedTime(n.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2 bg-[#141417] border-t border-zinc-800 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-zinc-400 hover:text-white font-semibold uppercase tracking-wider block w-full py-1 cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Avatar Dropdown (Shadcn Avatar & DropdownMenu) */}
        <div className="relative" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pl-1 sm:pr-2 rounded-lg hover:bg-zinc-850 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer text-left"
            title="User Profile & Perspective"
          >
            {/* Avatar Pill */}
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs shrink-0 font-mono">
              {initials}
            </div>
            <div className="hidden lg:flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-semibold text-zinc-200 truncate max-w-[110px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[110px]">
                {currentUser.role === 'ProjectManager' ? 'Const. Dir' : currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hidden sm:block shrink-0" />
          </button>

          {/* Shadcn User Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in text-left">
              {/* Profile Card Header */}
              <div className="p-3.5 bg-[#141417] border-b border-zinc-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs shrink-0 font-mono">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate font-sans">{currentUser.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate font-mono">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase tracking-wider">
                      {currentUser.department}
                    </span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-mono">
                      <ShieldCheck className="w-2.5 h-2.5" /> Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Role / Perspective Switcher Section */}
              <div className="p-2 space-y-1 border-b border-zinc-800/80">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
                  Switch Workspace Role
                </p>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {rolesList.map((role) => {
                    const isSelected = currentUser.role === role.value;
                    return (
                      <button
                        key={role.value}
                        onClick={() => {
                          onRoleChange(role.value);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-800 text-white font-semibold' 
                            : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {role.icon}
                          <span className="truncate">{role.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-1.5 space-y-0.5 border-b border-zinc-800/80 text-xs">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowCommandPalette(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-850 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Command className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Command Palette</span>
                  </span>
                  <kbd className="text-[10px] font-mono text-zinc-500">⌘K</kbd>
                </button>
              </div>

              {/* Sign Out Button */}
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </span>
                  <span className="text-[10px] font-mono text-rose-500">⇧⌘Q</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SHADCN COMMAND PALETTE (⌘K) MODAL                            */}
      {/* ============================================================ */}
      {showCommandPalette && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-fade-in text-left"
          onClick={() => setShowCommandPalette(false)}
        >
          <div 
            className="bg-[#111114] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input 
                type="text"
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Type a module name or command..."
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
              />
              <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Command Palette List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3 divide-y divide-zinc-850/60">
              {/* Modules Group */}
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
                  Workspace Modules
                </p>
                <div className="space-y-0.5">
                  {[
                    { id: 'overview', label: 'Executive Overview', desc: 'Real-time analytics and revenue metrics' },
                    { id: 'crm', label: 'Leads & CRM Pipeline', desc: 'Manage prospects, requirements, and follow-ups' },
                    { id: 'clients', label: 'Client Directory & Billing', desc: 'Corporate roster and client accounts' },
                    { id: 'projects', label: 'Projects & Construction Sites', desc: 'Milestones, Gantt progress, and safety' },
                    { id: 'employees', label: 'Employee & Labor Directory', desc: 'Personnel roster and access credentials' },
                    { id: 'assets', label: 'Assets & Heavy Machinery', desc: 'Excavators, cranes, and fleet registry' },
                    { id: 'materials', label: 'Materials & Procurement Stocks', desc: 'Inventory stocks and warehouse re-orders' },
                    { id: 'vendors', label: 'Logistics & Material Vendors', desc: 'Supply chain partners and delivery terms' },
                    { id: 'properties', label: 'Built Spaces & Apartments', desc: 'Unit sales, leasing, and vacancy index' },
                    { id: 'expenses', label: 'Expenses & Financial Ledger', desc: 'Budget sign-offs and disbursement tracking' },
                    { id: 'billing', label: 'Property Invoicing & Receivables', desc: 'Issue invoices and verify sync' },
                  ]
                    .filter(m => m.label.toLowerCase().includes(paletteQuery.toLowerCase()) || m.desc.toLowerCase().includes(paletteQuery.toLowerCase()))
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigateToTab?.(item.id);
                          setShowCommandPalette(false);
                          setPaletteQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-850 text-left transition-colors cursor-pointer group"
                      >
                        <div>
                          <p className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                            {item.desc}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300">
                          Jump ↵
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Quick Actions Group */}
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
                  System Commands
                </p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      onToggleTheme?.();
                      setShowCommandPalette(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-850 text-left transition-colors cursor-pointer group text-xs text-zinc-300 hover:text-white"
                  >
                    <span>Toggle Light / Dark Mode</span>
                    <span className="text-[10px] font-mono text-zinc-500">Theme</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowNotifications(true);
                      setShowCommandPalette(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-850 text-left transition-colors cursor-pointer group text-xs text-zinc-300 hover:text-white"
                  >
                    <span>View System & Ops Notifications</span>
                    <span className="text-[10px] font-mono text-zinc-500">Alerts</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCommandPalette(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-rose-950/30 text-left transition-colors cursor-pointer group text-xs text-rose-400"
                  >
                    <span>Terminate Session / Sign Out</span>
                    <span className="text-[10px] font-mono text-rose-500">Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/80 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
              <span>Navigate with click or Enter</span>
              <span>DOMUS OS Command Line</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
