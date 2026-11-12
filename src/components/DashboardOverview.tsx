/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Employee, Asset, Expense, Apartment, Client, Lead, Bill, Material, Vendor, SystemNotification } from '../types';
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  Calendar, 
  Download, 
  TrendingUp, 
  Building2, 
  Wrench, 
  ArrowUpRight,
  ShieldCheck,
  HardHat,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  Printer,
  Check,
  Filter,
  BarChart3,
  FileText,
  Bell,
  Eye,
  AlertTriangle,
  Info,
  Send,
  X,
  Target,
  Search,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface DashboardOverviewProps {
  projects: Project[];
  employees: Employee[];
  assets: Asset[];
  expenses: Expense[];
  apartments: Apartment[];
  clients?: Client[];
  leads?: Lead[];
  bills?: Bill[];
  materials?: Material[];
  vendors?: Vendor[];
  notifications?: SystemNotification[];
  onNavigateToRole: (role: any) => void;
  onNavigateToTab?: (tab: string) => void;
  onTriggerNotification?: (notif: { title: string; message: string; type: 'warning' | 'info' | 'success'; category: 'projects' | 'expenses' | 'materials' | 'system' }) => void;
  isBasicPlan?: boolean;
  theme?: 'light' | 'dark';
}

const PIE_COLORS_DARK = ['#fafafa', '#a1a1aa', '#71717a', '#3f3f46', '#27272a'];
const PIE_COLORS_LIGHT = ['#18181b', '#0284c7', '#059669', '#d97706', '#7c3aed'];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  projects,
  employees,
  assets,
  expenses,
  apartments,
  clients = [],
  leads = [],
  bills = [],
  materials = [],
  vendors = [],
  notifications = [],
  onNavigateToRole,
  onNavigateToTab,
  onTriggerNotification,
  isBasicPlan = false,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const pieColors = isLight ? PIE_COLORS_LIGHT : PIE_COLORS_DARK;
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports' | 'notifications'>('overview');
  
  // Date Range State
  const [dateRange, setDateRange] = useState('Jan 20, 2026 - Dec 31, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('2026-01-20');
  const [customEndDate, setCustomEndDate] = useState('2026-12-31');

  // Export / Download Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Report Preview Modal State
  const [previewReport, setPreviewReport] = useState<{ title: string; subtitle: string; headers: string[]; rows: (string | number)[][] } | null>(null);

  // Notifications Filter State
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'warning' | 'info' | 'success'>('all');
  const [simulatingAlert, setSimulatingAlert] = useState(false);

  // Operational metrics
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalAssetValue = assets.reduce((sum, a) => sum + a.value, 0);
  const totalEmployees = employees.length;
  
  const occupiedCount = apartments.filter(a => a.status === 'Rented' || a.status === 'Sold').length;
  const occupancyRate = apartments.length > 0 ? Math.round((occupiedCount / apartments.length) * 100) : 0;
  
  const approvedExpenses = expenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

  // 12-Month Inflow & Outflow Chart Data
  const monthlyRevenueData = [
    { name: 'Jan', revenue: 2400, expense: 1800, total: 2400, target: 1800 },
    { name: 'Feb', revenue: 1398, expense: 1200, total: 1398, target: 2000 },
    { name: 'Mar', revenue: 9800, expense: 4200, total: 9800, target: 2780 },
    { name: 'Apr', revenue: 3908, expense: 2100, total: 3908, target: 2100 },
    { name: 'May', revenue: 4800, expense: 2900, total: 4800, target: 3200 },
    { name: 'Jun', revenue: 3800, expense: 2400, total: 3800, target: 2500 },
    { name: 'Jul', revenue: 4300, expense: 3100, total: 4300, target: 3400 },
    { name: 'Aug', revenue: 5300, expense: 3700, total: 5300, target: 4100 },
    { name: 'Sep', revenue: 4900, expense: 3200, total: 4900, target: 3800 },
    { name: 'Oct', revenue: 6100, expense: 4100, total: 6100, target: 4500 },
    { name: 'Nov', revenue: 5700, expense: 3900, total: 5700, target: 4300 },
    { name: 'Dec', revenue: 7200, expense: 4800, total: 7200, target: 5100 },
  ];

  // Dynamic Recent Sales data
  const recentSales = [
    {
      name: clients[0]?.name || 'David Miller',
      email: clients[0]?.email || 'd.miller@client.com',
      amount: '+$1,999.00',
      initials: (clients[0]?.name || 'David Miller').split(' ').map(n => n[0]).join('').slice(0, 2),
      unit: clients[0]?.assignedApartmentNumber ? `Unit ${clients[0].assignedApartmentNumber}` : 'Penthouse 42B',
      status: 'Paid'
    },
    {
      name: clients[1]?.name || 'Olivia Martin',
      email: clients[1]?.email || 'olivia.martin@email.com',
      amount: '+$45,200.00',
      initials: (clients[1]?.name || 'Olivia Martin').split(' ').map(n => n[0]).join('').slice(0, 2),
      unit: 'Commercial Tower Suite 14',
      status: 'Paid'
    },
    {
      name: clients[2]?.name || 'Jackson Lee',
      email: clients[2]?.email || 'jackson.lee@email.com',
      amount: '+$3,450.00',
      initials: (clients[2]?.name || 'Jackson Lee').split(' ').map(n => n[0]).join('').slice(0, 2),
      unit: 'Sky Villa #09',
      status: 'Paid'
    },
    {
      name: 'Isabella Nguyen',
      email: 'isabella.nguyen@email.com',
      amount: '+$2,850.00',
      initials: 'IN',
      unit: 'Oceanview Condo #304',
      status: 'Paid'
    },
    {
      name: 'William Kim',
      email: 'will@email.com',
      amount: '+$18,750.00',
      initials: 'WK',
      unit: 'Retail Space B-01',
      status: 'Paid'
    }
  ];

  // Expense categories
  const expenseByCategory = expenses.reduce((acc: { [key: string]: number }, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const expenseChartData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  const activeMachineryCount = assets.filter(a => a.status === 'Operational').length;
  const machineryHealthRate = assets.length > 0 ? Math.round((activeMachineryCount / assets.length) * 100) : 100;

  // Real Dynamic CSV File Downloader
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(`Exported "${filename}" successfully!`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Export handlers
  const handleExportExecutiveSummary = () => {
    const csvContent = [
      'DOMUS OS - Executive Summary Report',
      `Date Range,${dateRange}`,
      `Generated At,${new Date().toISOString()}`,
      '',
      'Metric,Value',
      `Total Construction Budget,$${totalBudget.toLocaleString()}`,
      `Total Capital Disbursed,$${totalSpent.toLocaleString()}`,
      `Total Equipment Valuation,$${totalAssetValue.toLocaleString()}`,
      `Total Active Workforce,${totalEmployees}`,
      `Units Occupancy Rate,${occupancyRate}%`,
      `Active Machinery Health,${machineryHealthRate}%`,
      `Approved Expenditures,$${approvedExpenses.toLocaleString()}`,
      `Pending Sign-off Expenses,$${pendingExpenses.toLocaleString()}`,
      '',
      'Active Construction Sites',
      'Site Name,Supervisor,Safety Rating,Progress,Budget,Spent',
      ...projects.map(p => `"${p.name}","${p.siteSupervisor}","${p.safetyRating}",${p.progress}%,$${p.budget},$${p.spent}`)
    ].join('\n');

    downloadCSV(`Executive_Summary_${Date.now()}.csv`, csvContent);
  };

  const handleExportFinancialLedger = () => {
    const csvContent = [
      'DOMUS OS - Financial Ledger & Expenses',
      `Date Range,${dateRange}`,
      '',
      'Expense ID,Category,Amount,Submitted By,Project ID,Status,Date',
      ...expenses.map(e => `"${e.id}","${e.category}",$${e.amount},"${e.submittedBy}","${e.projectId}","${e.status}","${e.date}"`)
    ].join('\n');

    downloadCSV(`Financial_Ledger_${Date.now()}.csv`, csvContent);
  };

  const handleExportSitesAndMilestones = () => {
    const csvContent = [
      'DOMUS OS - Construction Sites & Safety Ledger',
      '',
      'Project ID,Project Name,Location,Supervisor,Budget,Spent,Progress,Safety Rating',
      ...projects.map(p => `"${p.id}","${p.name}","${p.location}","${p.siteSupervisor}",$${p.budget},$${p.spent},${p.progress}%,"${p.safetyRating}"`)
    ].join('\n');

    downloadCSV(`Construction_Sites_${Date.now()}.csv`, csvContent);
  };

  const handleExportClientsAndBilling = () => {
    const csvContent = [
      'DOMUS OS - Client Directory & Invoices',
      '',
      'Client ID,Client Name,Email,Phone,Assigned Property,Deal Type,Total Billed',
      ...clients.map(c => `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.assignedApartmentNumber || 'N/A'}","${c.dealType || 'N/A'}",$${(c.totalBilled || 0).toLocaleString()}`)
    ].join('\n');

    downloadCSV(`Clients_Billing_${Date.now()}.csv`, csvContent);
  };

  // Date Range Quick Select Presets
  const applyDateRangePreset = (label: string) => {
    setDateRange(label);
    setShowDatePicker(false);
    setDownloadSuccessToast(`Dashboard period updated: ${label}`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  // Simulate an operational alert
  const handleSimulateAlert = () => {
    setSimulatingAlert(true);
    const mockEvents = [
      { title: 'Site Inspection Passed', message: 'Horizon Tower structural engineering inspection passed 100% compliance with zero defects.', type: 'success' as const, category: 'projects' as const },
      { title: 'Client Wire Received', message: 'Wire transfer of $125,000 received from David Miller for Sky Penthouse milestone 2.', type: 'success' as const, category: 'expenses' as const },
      { title: 'Material Re-Order Alert', message: 'Portland Cement Grade 53 reached threshold (180 bags remaining) at Riverside Project.', type: 'warning' as const, category: 'materials' as const },
      { title: 'Heavy Fleet Scheduled Check', message: 'Liebherr Tower Crane scheduled for 500-hour hydraulic oil change tomorrow morning.', type: 'info' as const, category: 'system' as const }
    ];
    const picked = mockEvents[Math.floor(Math.random() * mockEvents.length)];

    setTimeout(() => {
      onTriggerNotification?.(picked);
      setSimulatingAlert(false);
      setDownloadSuccessToast(`New operational alert dispatched: ${picked.title}`);
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    }, 600);
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* Dynamic Success Notification Toast */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessToast}</span>
          <button onClick={() => setDownloadSuccessToast(null)} className="ml-2 text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP HEADER: Title, Subtitle, Date Picker & Action Buttons */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 relative">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Real-time analytics, capital allocations, and construction operations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap relative">
          {/* Date Range Picker with Interactive Dropdown Popover */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-[#111114] text-xs font-medium text-zinc-300 hover:bg-zinc-850 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer shadow-sm"
              title="Click to change reporting date interval"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-1" />
            </button>

            {/* Date Picker Dropdown Popover */}
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl z-50 p-3 space-y-3 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Select Reporting Window
                  </span>
                  <button 
                    onClick={() => setShowDatePicker(false)}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Filters */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { label: 'Today', value: 'Today (Nov 9, 2026)' },
                    { label: 'Last 7 Days', value: 'Nov 2, 2026 - Nov 9, 2026' },
                    { label: 'Last 30 Days', value: 'Oct 10, 2026 - Nov 9, 2026' },
                    { label: 'Q1 2026', value: 'Jan 1, 2026 - Mar 31, 2026' },
                    { label: 'Year to Date', value: 'Jan 1, 2026 - Nov 9, 2026' },
                    { label: 'Full Year 2026', value: 'Jan 20, 2026 - Dec 31, 2026' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyDateRangePreset(preset.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        dateRange === preset.value 
                          ? 'bg-zinc-800 text-white font-semibold border border-zinc-700' 
                          : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Range Selection */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Custom Date Interval
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Start Date</label>
                      <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">End Date</label>
                      <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => applyDateRangePreset(`${customStartDate} - ${customEndDate}`)}
                    className="w-full py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer mt-1"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Download Report Button with Interactive Export Hub */}
          <button 
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            title="Export analytics, CSV datasets, and executive summaries"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SHADCN SEGMENTED TABS BAR                                 */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1 flex-wrap gap-2">
        <div className="inline-flex items-center rounded-lg bg-zinc-900/80 p-1 border border-zinc-800 text-xs font-medium text-zinc-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'hover:text-zinc-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
            {notifications.some(n => !n.read) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span>Live Operations Feed</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. TAB 1: OVERVIEW (Signature Studio Admin Layout)            */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Revenue / Portfolio Budget */}
            <div className="rounded-xl border border-zinc-800 bg-[#111114] text-zinc-200 p-5 space-y-2 shadow-sm hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">
                ${(totalBudget / 1000000).toFixed(2)}M
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <span className="text-emerald-400 flex items-center font-semibold">
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +20.1%
                </span>
                <span>from last month</span>
              </p>
            </div>

            {/* Metric 2: Subscriptions / Property Occupancy */}
            <div className="rounded-xl border border-zinc-800 bg-[#111114] text-zinc-200 p-5 space-y-2 shadow-sm hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Subscriptions & Leases</span>
                <Users className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">
                +{occupiedCount * 45 + 120}
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <span className="text-emerald-400 flex items-center font-semibold">
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +180.1%
                </span>
                <span>from last month</span>
              </p>
            </div>

            {/* Metric 3: Portfolio Sales & Spaces */}
            <div className="rounded-xl border border-zinc-800 bg-[#111114] text-zinc-200 p-5 space-y-2 shadow-sm hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Portfolio Sales & Spaces</span>
                <CreditCard className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">
                +{apartments.length} Units
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <span className="text-emerald-400 flex items-center font-semibold">
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +19%
                </span>
                <span>from last month</span>
              </p>
            </div>

            {/* Metric 4: Active Workforce */}
            <div className="rounded-xl border border-zinc-800 bg-[#111114] text-zinc-200 p-5 space-y-2 shadow-sm hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Active Workforce</span>
                <Activity className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">
                +{totalEmployees * 12 + 8}
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                <span className="text-emerald-400 flex items-center font-semibold">
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +201
                </span>
                <span>since last hour</span>
              </p>
            </div>
          </div>

          {/* Primary 2-Column Grid: 12-Month Bar Chart & Recent Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* Left 4-Columns: 12-Month Capital Bar Chart */}
            <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-[#111114] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight font-sans">Overview</h3>
                  <p className="text-xs text-zinc-400 font-sans">Monthly capital deployment and revenue progression</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-white" /> Capital Inflow ($k)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#e4e4e7' : '#27272a'} opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: isLight ? '#e4e4e7' : '#27272a' }} 
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString()}`, 'Capital Flow']}
                      cursor={{ fill: isLight ? '#f4f4f5' : '#27272a', opacity: isLight ? 0.6 : 0.3 }}
                      contentStyle={{ 
                        backgroundColor: isLight ? '#ffffff' : '#18181b', 
                        borderRadius: '8px', 
                        borderColor: isLight ? '#e4e4e7' : '#27272a',
                        color: isLight ? '#09090b' : '#fafafa',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill={isLight ? '#18181b' : '#ffffff'} 
                      radius={[4, 4, 0, 0]} 
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 3-Columns: Recent Sales & Conversions */}
            <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-[#111114] p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight font-sans">Recent Sales</h3>
                <p className="text-xs text-zinc-400 font-sans">You made 265 sales this month.</p>
              </div>

              <div className="space-y-4 my-2">
                {recentSales.map((sale, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-850 border border-zinc-750 flex items-center justify-center font-bold text-white text-xs shrink-0 font-mono">
                        {sale.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate font-sans">{sale.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate font-mono">{sale.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-white font-mono text-sm block">
                        {sale.amount}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {sale.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-850">
                <button 
                  onClick={() => onNavigateToTab ? onNavigateToTab('clients') : onNavigateToRole('Admin')}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View All Customer Ledger Records</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Operational Cards */}
          <div className={`grid grid-cols-1 ${isBasicPlan ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
            {/* Card 1: Project Progress Tracker */}
            {!isBasicPlan && (
              <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-white tracking-tight">Active Sites & Milestones</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-850 border border-zinc-750 text-zinc-400 font-mono">
                    {projects.length} Sites
                  </span>
                </div>

                <div className="space-y-3">
                  {projects.slice(0, 3).map((p) => (
                    <div key={p.id} className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-white font-sans">{p.name}</h4>
                          <p className="text-[10px] text-zinc-400">Supervisor: {p.siteSupervisor}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                          {p.safetyRating}
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Progress</span>
                          <span className="font-mono text-zinc-200">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-white h-full transition-all duration-500 rounded-full" 
                            style={{ width: `${p.progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => onNavigateToTab ? onNavigateToTab('projects') : onNavigateToRole('ProjectManager')} 
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Manage Construction Sites</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Card 2: Expense Allocation Donut Chart */}
            <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Expense Allocation</h3>
                  <p className="text-[11px] text-zinc-400">Operational ledger distribution</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  YTD
                </span>
              </div>

              <div className="h-48 relative flex items-center justify-center">
                {expenseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Expenditure']}
                        contentStyle={{ 
                          backgroundColor: isLight ? '#ffffff' : '#18181b', 
                          borderRadius: '8px', 
                          borderColor: isLight ? '#e4e4e7' : '#27272a',
                          color: isLight ? '#09090b' : '#fafafa',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-zinc-500 text-xs">No expense data logged</div>
                )}
                <div className="absolute flex flex-col items-center pointer-events-none">
                  <span className="text-xl font-bold text-white font-mono">
                    ${((approvedExpenses + pendingExpenses) / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {expenseChartData.slice(0, 4).map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto font-mono text-zinc-400 font-medium">${(item.value / 1000).toFixed(0)}k</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onNavigateToTab ? onNavigateToTab('expenses') : onNavigateToRole('FinancialOfficer')} 
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Open Financial Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Fleet & Heavy Machinery Health */}
            {!isBasicPlan && (
              <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Machinery & Fleet Registry</h3>
                    <p className="text-[11px] text-zinc-400">{assets.length} logged assets</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                    {machineryHealthRate}% OK
                  </span>
                </div>

                <div className="space-y-3">
                  {assets.slice(0, 3).map((a) => (
                    <div key={a.id} className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-semibold text-white font-sans">{a.name}</h4>
                        <p className="text-[10px] text-zinc-400">Location: {a.location}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                        a.status === 'Operational'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => onNavigateToTab ? onNavigateToTab('assets') : onNavigateToRole('Admin')} 
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Manage Asset Registry</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. TAB 2: ANALYTICS (Inflow/Outflow, Funnel & Velocity)        */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Analytics Top Metric Ribbons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-1">
              <span className="text-xs text-zinc-400 font-medium">Net Operating Margin</span>
              <div className="text-2xl font-bold text-white font-mono">+38.5%</div>
              <p className="text-[11px] text-emerald-400 font-mono">+$2.4M vs Q4 baseline</p>
            </div>
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-1">
              <span className="text-xs text-zinc-400 font-medium">Capital Deployment Velocity</span>
              <div className="text-2xl font-bold text-white font-mono">94.2%</div>
              <p className="text-[11px] text-zinc-400 font-mono">On-schedule milestone payout</p>
            </div>
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-1">
              <span className="text-xs text-zinc-400 font-medium">Lead Conversion Velocity</span>
              <div className="text-2xl font-bold text-white font-mono">28.4%</div>
              <p className="text-[11px] text-emerald-400 font-mono">Avg 18 days inquiry to lease</p>
            </div>
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-1">
              <span className="text-xs text-zinc-400 font-medium">Safety Compliance Index</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">99.8%</div>
              <p className="text-[11px] text-zinc-400 font-mono">Zero OSHA reportable lost-time</p>
            </div>
          </div>

          {/* Cashflow Inflow vs Outflow Dual Chart */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#111114] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Capital Cashflow Dynamics: Inflow vs Expenditure
                </h3>
                <p className="text-xs text-zinc-400">
                  Monthly reconciliation of real estate revenues against construction and operational disbursements
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <span className={`w-3 h-3 rounded ${isLight ? 'bg-zinc-950' : 'bg-white'}`} /> Revenue Inflow
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className={`w-3 h-3 rounded ${isLight ? 'bg-zinc-400' : 'bg-zinc-600'}`} /> Operational Outflow
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#e4e4e7' : '#27272a'} opacity={0.6} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: isLight ? '#e4e4e7' : '#27272a' }} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}k`} />
                  <Tooltip 
                    formatter={(v: any, name: any) => [`$${v.toLocaleString()}k`, name === 'revenue' ? 'Revenue Inflow' : 'Capital Outflow']}
                    cursor={{ fill: isLight ? '#f4f4f5' : '#27272a', opacity: isLight ? 0.6 : 0.3 }}
                    contentStyle={{ 
                      backgroundColor: isLight ? '#ffffff' : '#18181b', 
                      borderRadius: '8px', 
                      borderColor: isLight ? '#e4e4e7' : '#27272a', 
                      color: isLight ? '#09090b' : '#fafafa', 
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="revenue" fill={isLight ? '#18181b' : '#ffffff'} radius={[4, 4, 0, 0]} name="revenue" />
                  <Bar dataKey="expense" fill={isLight ? '#94a3b8' : '#52525b'} radius={[4, 4, 0, 0]} name="expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2-Column Analytics: Funnel & Sector Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead & CRM Pipeline Funnel */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">CRM & Client Conversion Funnel</h3>
                  <p className="text-[11px] text-zinc-400">Acquisition pipeline conversion velocity</p>
                </div>
                <button 
                  onClick={() => onNavigateToTab?.('crm')} 
                  className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Open CRM</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { stage: '1. Raw Inquiries & Leads', count: leads.length + 140, pct: '100%', color: 'bg-zinc-300' },
                  { stage: '2. Budget & Unit Matched', count: Math.round((leads.length + 140) * 0.65), pct: '65%', color: 'bg-zinc-400' },
                  { stage: '3. Site Inspections & Tours', count: Math.round((leads.length + 140) * 0.42), pct: '42%', color: 'bg-zinc-500' },
                  { stage: '4. Legal Term Sheets Issued', count: Math.round((leads.length + 140) * 0.28), pct: '28%', color: 'bg-zinc-600' },
                  { stage: '5. Converted Client Accounts', count: clients.length + 18, pct: '18%', color: 'bg-white' }
                ].map((item) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-300 font-medium">
                      <span>{item.stage}</span>
                      <span className="font-mono text-zinc-400">{item.count} leads ({item.pct})</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: item.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset & Portfolio Segment Distribution */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Portfolio Capital Allocation</h3>
                  <p className="text-[11px] text-zinc-400">Asset class weighting across urban markets</p>
                </div>
                <span className="text-xs font-mono text-zinc-500">4 Core Sectors</span>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { name: 'Luxury Residential High-Rise', allocation: '48%', amount: '$18.4M', sites: '3 Towers' },
                  { name: 'Commercial Grade-A Office Hubs', allocation: '28%', amount: '$10.7M', sites: '2 Complexes' },
                  { name: 'Mixed-Use Retail & Plaza', allocation: '14%', amount: '$5.3M', sites: '1 Project' },
                  { name: 'Civil Infrastructure & Logistics', allocation: '10%', amount: '$3.8M', sites: '2 Warehouses' },
                ].map((sec) => (
                  <div key={sec.name} className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-white">{sec.name}</h4>
                      <p className="text-[10px] text-zinc-400">{sec.sites} • {sec.amount} committed</p>
                    </div>
                    <span className="font-mono font-bold text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                      {sec.allocation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB 3: REPORTS (Catalogue, Previews & Instant CSV Exports) */}
      {/* ============================================================ */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Enterprise Reporting & Audit Log</h2>
              <p className="text-xs text-zinc-400">Download formatted financial balance sheets, safety audits, and client accounts</p>
            </div>
            <button
              onClick={handleExportExecutiveSummary}
              className="px-3.5 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Portfolio Bundle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Report 1: Executive Balance Sheet */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 border border-zinc-750 text-zinc-300">
                    FIN-2026-Q1
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Audited
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Executive Quarterly Capital Statement</h3>
                <p className="text-xs text-zinc-400">
                  Comprehensive summary of budgets, capital deployed, variances, and operational expenses.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center gap-2">
                <button
                  onClick={() => setPreviewReport({
                    title: 'Executive Quarterly Capital Statement (Q1 2026)',
                    subtitle: 'Consolidated capital accounts and variances',
                    headers: ['Category', 'Allocated Budget', 'Actual Deployed', 'Variance', 'Status'],
                    rows: [
                      ['Site Construction & Structural', `$${(totalBudget * 0.55).toLocaleString()}`, `$${(totalSpent * 0.52).toLocaleString()}`, '+3.0%', 'On Track'],
                      ['Procurement & Raw Materials', `$${(totalBudget * 0.22).toLocaleString()}`, `$${(totalSpent * 0.24).toLocaleString()}`, '-2.0%', 'Within Tolerance'],
                      ['Heavy Plant & Machinery', `$${(totalBudget * 0.15).toLocaleString()}`, `$${(totalSpent * 0.14).toLocaleString()}`, '+1.0%', 'Optimal'],
                      ['Workforce Payroll & Field Ops', `$${(totalBudget * 0.08).toLocaleString()}`, `$${(totalSpent * 0.08).toLocaleString()}`, '0.0%', 'Balanced'],
                    ]
                  })}
                  className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={handleExportExecutiveSummary}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Report 2: Site Safety & OSHA Compliance */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 border border-zinc-750 text-zinc-300">
                    SAFE-AUDIT
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Certified
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Construction Safety & OSHA Inspection Record</h3>
                <p className="text-xs text-zinc-400">
                  Supervisor sign-offs, zero-incident safety ratings, and field milestone verifications.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center gap-2">
                <button
                  onClick={() => setPreviewReport({
                    title: 'Construction Safety & OSHA Inspection Record',
                    subtitle: 'Field supervisor certifications and safety indexes',
                    headers: ['Project Name', 'Supervisor', 'Safety Rating', 'Site Progress', 'Inspection Date'],
                    rows: projects.map(p => [p.name, p.siteSupervisor, p.safetyRating, `${p.progress}%`, 'Nov 8, 2026'])
                  })}
                  className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={handleExportSitesAndMilestones}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Report 3: Client Receivables & Billing */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#111114] space-y-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 border border-zinc-750 text-zinc-300">
                    REC-AGING
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Real-Time
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Client Receivables & Payment Ledger</h3>
                <p className="text-xs text-zinc-400">
                  Complete billing registry of client accounts, assigned suites, invoices, and payment statuses.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center gap-2">
                <button
                  onClick={() => setPreviewReport({
                    title: 'Client Receivables & Payment Ledger',
                    subtitle: 'Accounts receivable tracking and reconciliation',
                    headers: ['Client Name', 'Property', 'Deal Type', 'Invoiced Amount', 'Status'],
                    rows: clients.map(c => [c.name, c.assignedApartmentNumber || 'Unit 4B', c.dealType || 'Sale', `$${(c.totalBilled || 25000).toLocaleString()}`, 'Current'])
                  })}
                  className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={handleExportClientsAndBilling}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB 4: NOTIFICATIONS (Interactive Operational Feed)        */}
      {/* ============================================================ */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Operational Alerts</h2>
              <p className="text-xs text-zinc-400">Live system dispatch events, safety flags, and financial transactions</p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Filters */}
              <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
                {(['all', 'warning', 'info', 'success'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setNotificationFilter(filter)}
                    className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                      notificationFilter === filter
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Simulate Operational Event Button */}
              <button
                onClick={handleSimulateAlert}
                disabled={simulatingAlert}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3 text-emerald-400" />
                <span>{simulatingAlert ? 'Dispatching...' : 'Simulate Live Alert'}</span>
              </button>
            </div>
          </div>

          {/* Notifications Feed List */}
          <div className="space-y-3">
            {notifications
              .filter(n => notificationFilter === 'all' || n.type === notificationFilter)
              .map((n) => (
                <div 
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all text-xs flex items-start justify-between gap-3 ${
                    !n.read 
                      ? 'bg-zinc-900/90 border-zinc-700/80 shadow-md' 
                      : 'bg-[#111114] border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {n.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white font-sans">{n.title}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400 uppercase">
                          {n.category}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Unread" />
                        )}
                      </div>
                      <p className="text-zinc-300 mt-1 leading-relaxed font-sans">{n.message}</p>
                      <span className="text-[10px] text-zinc-500 font-mono mt-2 block">{n.timestamp}</span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 font-mono uppercase shrink-0">
                    {n.type}
                  </span>
                </div>
              ))}

            {notifications.length === 0 && (
              <div className="p-12 text-center text-zinc-500 border border-zinc-800/80 rounded-xl bg-[#111114]">
                <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-400">All systems operating normally</p>
                <p className="text-xs text-zinc-500 mt-1">No pending operational warnings or safety flags.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. EXPORT & DOWNLOAD HUB MODAL (Triggered by Download Button) */}
      {/* ============================================================ */}
      {showExportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="bg-[#111114] border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Executive Export & Reporting Hub</h3>
                  <p className="text-xs text-zinc-400">Export verified CSV statements and executive audit records</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Export Cards */}
            <div className="space-y-3">
              {/* Option 1: Executive Portfolio Summary */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Executive Portfolio Summary (.CSV)</h4>
                  <p className="text-[11px] text-zinc-400">Capital balances, progress KPIs, workforce, and asset health</p>
                </div>
                <button
                  onClick={() => {
                    handleExportExecutiveSummary();
                    setShowExportModal(false);
                  }}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Option 2: Financial Ledger & Expenses */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Financial Ledger & Expenses (.CSV)</h4>
                  <p className="text-[11px] text-zinc-400">All submitted, approved, and pending capital disbursements</p>
                </div>
                <button
                  onClick={() => {
                    handleExportFinancialLedger();
                    setShowExportModal(false);
                  }}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Option 3: Construction Sites & Safety */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Construction Sites & Safety Ledger (.CSV)</h4>
                  <p className="text-[11px] text-zinc-400">Site supervisors, completion milestones, and safety scores</p>
                </div>
                <button
                  onClick={() => {
                    handleExportSitesAndMilestones();
                    setShowExportModal(false);
                  }}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Option 4: Client Directory & Billings */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Client Portfolio & Invoicing (.CSV)</h4>
                  <p className="text-[11px] text-zinc-400">Corporate client roster, unit assignments, and accounts aging</p>
                </div>
                <button
                  onClick={() => {
                    handleExportClientsAndBilling();
                    setShowExportModal(false);
                  }}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Format: UTF-8 RFC 4180 CSV</span>
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Executive View</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. REPORT PREVIEW MODAL                                       */}
      {/* ============================================================ */}
      {previewReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPreviewReport(null)}
        >
          <div 
            className="bg-[#111114] border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{previewReport.title}</h3>
                <p className="text-xs text-zinc-400">{previewReport.subtitle}</p>
              </div>
              <button 
                onClick={() => setPreviewReport(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border border-zinc-850 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-850 font-mono uppercase text-[10px]">
                  <tr>
                    {previewReport.headers.map((h, i) => (
                      <th key={i} className="p-2.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-200">
                  {previewReport.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/40">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 font-sans">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-zinc-850 flex justify-end">
              <button
                onClick={() => {
                  setPreviewReport(null);
                  handleExportExecutiveSummary();
                }}
                className="px-3.5 py-1.5 bg-white text-zinc-950 font-semibold text-xs rounded-lg hover:bg-zinc-200 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export this Report to CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
