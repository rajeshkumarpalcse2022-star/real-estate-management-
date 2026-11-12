/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bill, Apartment } from '../types';
import { 
  FileText, 
  Plus, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  Search, 
  Home, 
  Download, 
  Receipt, 
  User, 
  CreditCard, 
  Building,
  Settings,
  Printer,
  RotateCcw,
  Save,
  Check
} from 'lucide-react';

export interface BillingSettings {
  companyName: string;
  companyAddress: string;
  companyContact: string;
  taxId: string;
  invoiceTitle: string;
  paymentTerms: string;
  bankDetails: string;
  footerNote: string;
  lateFeeNotice: string;
}

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  companyName: 'DOMUS REAL ESTATE & INFRASTRUCTURE INC.',
  companyAddress: 'Suite 800, Horizon Executive Tower, New York, NY 10001',
  companyContact: 'billing@domus-os.com • +1 (800) 555-DOMUS',
  taxId: 'US-EIN-984210984',
  invoiceTitle: 'OFFICIAL PROPERTY TAX INVOICE',
  paymentTerms: 'Payment due within 30 days of issuance. Direct ACH or wire transfers accepted.',
  bankDetails: 'Bank: JPMorgan Chase NA • Account: 9840-2819-3310 • Routing: 021000021 • Swift: CHASUS33',
  footerNote: 'Thank you for choosing DOMUS OS properties. For ledger inquiries, contact accounts@domus-os.com.',
  lateFeeNotice: 'Late payments incur a 1.5% interest charge per month after 30 days past due.',
};

interface BillingManagerProps {
  bills: Bill[];
  apartments: Apartment[];
  onAddBill: (b: Bill) => void;
  onRemoveBill: (id: string) => void;
  onUpdateBill: (id: string, fields: Partial<Bill>) => void;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const BillingManager: React.FC<BillingManagerProps> = ({
  bills,
  apartments,
  onAddBill,
  onRemoveBill,
  onUpdateBill,
  onTriggerNotification,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [billingType, setBillingType] = useState<'Rental' | 'Sold'>('Rental');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Recording Payments
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque'>('Bank Transfer');

  // PDF Preview & Settings States
  const [previewInvoice, setPreviewInvoice] = useState<Bill | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load custom billing texts from localStorage
  const [billingSettings, setBillingSettings] = useState<BillingSettings>(() => {
    try {
      const saved = localStorage.getItem('domus_billing_settings');
      return saved ? { ...DEFAULT_BILLING_SETTINGS, ...JSON.parse(saved) } : DEFAULT_BILLING_SETTINGS;
    } catch {
      return DEFAULT_BILLING_SETTINGS;
    }
  });

  const [editingSettings, setEditingSettings] = useState<BillingSettings>(billingSettings);

  // Calculations
  const totalInvoiced = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalCollected = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0);
  const totalOutstanding = bills.filter(b => b.status !== 'Paid').reduce((sum, b) => sum + b.amount, 0);
  const recoveryRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0';

  // Handle auto-prefilling from apartment choice
  const handleApartmentSelect = (aptId: string) => {
    setSelectedApartmentId(aptId);
    const apt = apartments.find(a => a.id === aptId);
    if (apt) {
      setCustomerName(apt.tenantName || '');
      setBillingType(apt.status === 'Rented' ? 'Rental' : 'Sold');
      setAmount(apt.status === 'Rented' ? (apt.monthlyRent?.toString() || '') : (apt.price?.toString() || ''));
      setDescription(
        apt.status === 'Rented' 
          ? `Monthly rental charge for unit ${apt.unitNumber} at ${apt.buildingName}.` 
          : `Property sales milestone installment for unit ${apt.unitNumber} at ${apt.buildingName}.`
      );
    }
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApartmentId || !customerName || !customerEmail || !amount || !dueDate) return;

    const apt = apartments.find(a => a.id === selectedApartmentId);
    if (!apt) return;

    const newBill: Bill = {
      id: `BIL-${Math.floor(500 + Math.random() * 500)}`,
      billNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      apartmentId: selectedApartmentId,
      buildingName: apt.buildingName,
      unitNumber: apt.unitNumber,
      propertyType: apt.type,
      billingType,
      customerName,
      customerEmail,
      amount: Number(amount),
      dueDate,
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'Unpaid',
      description,
    };

    onAddBill(newBill);
    onTriggerNotification(
      'Invoice Dispatched',
      `Invoice ${newBill.billNumber} for $${Number(amount).toLocaleString()} raised against "${customerName}" is now active.`,
      'success'
    );

    // Reset states
    setShowAddForm(false);
    setSelectedApartmentId('');
    setCustomerName('');
    setCustomerEmail('');
    setAmount('');
    setDueDate('');
    setDescription('');
  };

  const handleConfirmPayment = (billId: string) => {
    onUpdateBill(billId, {
      status: 'Paid',
      paymentMethod,
    });
    onTriggerNotification(
      'Payment Recorded',
      `Invoice settled and ledger updated via ${paymentMethod}.`,
      'success'
    );
    setActivePaymentId(null);
  };

  // Save Settings Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setBillingSettings(editingSettings);
    try {
      localStorage.setItem('domus_billing_settings', JSON.stringify(editingSettings));
    } catch (err) {
      console.error('Failed to save billing settings', err);
    }
    setShowSettingsModal(false);
    onTriggerNotification(
      'Settings Updated',
      'Custom billing texts, invoice headers, and legal notes updated successfully.',
      'success'
    );
  };

  const handleResetSettings = () => {
    setEditingSettings(DEFAULT_BILLING_SETTINGS);
  };

  // Download Invoice as clean HTML/Document format
  const handleDownloadInvoiceFile = (bill: Bill) => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${billingSettings.invoiceTitle} - ${bill.billNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #18181b; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #18181b; padding-bottom: 20px; }
    .company-name { font-size: 20px; font-weight: bold; letter-spacing: -0.5px; }
    .company-sub { font-size: 12px; color: #52525b; margin-top: 4px; }
    .inv-title { font-size: 20px; font-weight: bold; text-align: right; color: #09090b; }
    .inv-badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; background: ${bill.status === 'Paid' ? '#dcfce7' : '#fee2e2'}; color: ${bill.status === 'Paid' ? '#15803d' : '#b91c1c'}; margin-top: 5px; }
    .details { display: flex; justify-content: space-between; margin: 30px 0; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; font-weight: bold; margin-bottom: 6px; }
    .box { font-size: 13px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    th { text-align: left; background: #f4f4f5; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e4e4e7; }
    td { padding: 14px; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
    .amount { text-align: right; font-weight: bold; }
    .total-row { display: flex; justify-content: flex-end; margin-top: 15px; }
    .total-box { width: 300px; background: #fafafa; border: 1px solid #e4e4e7; padding: 15px; border-radius: 8px; }
    .total-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .grand-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 1px solid #e4e4e7; padding-top: 10px; margin-top: 8px; color: #09090b; }
    .notes { margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; line-height: 1.6; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 20px; }
    @media print {
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${billingSettings.companyName}</div>
      <div class="company-sub">${billingSettings.companyAddress}</div>
      <div class="company-sub">${billingSettings.companyContact} • Tax ID: ${billingSettings.taxId}</div>
    </div>
    <div>
      <div class="inv-title">${billingSettings.invoiceTitle}</div>
      <div style="text-align: right;"><span class="inv-badge">${bill.status.toUpperCase()}</span></div>
      <div class="company-sub" style="text-align: right; margin-top: 6px;">Invoice No: <strong>${bill.billNumber}</strong></div>
    </div>
  </div>

  <div class="details">
    <div class="box">
      <div class="section-title">Billed To (Client / Tenant)</div>
      <strong>${bill.customerName}</strong><br>
      Email: ${bill.customerEmail}<br>
      Property: ${bill.buildingName}, Unit ${bill.unitNumber}<br>
      Category: ${bill.billingType} (${bill.propertyType})
    </div>
    <div class="box" style="text-align: right;">
      <div class="section-title">Invoice Schedule</div>
      Issue Date: <strong>${bill.issuedDate}</strong><br>
      Payment Due: <strong>${bill.dueDate}</strong><br>
      Settlement Currency: <strong>USD ($)</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th>Property Unit</th>
        <th>Billing Type</th>
        <th style="text-align: right;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${bill.description || `${bill.billingType} settlement for ${bill.buildingName} unit ${bill.unitNumber}`}</td>
        <td>Unit ${bill.unitNumber} (${bill.propertyType})</td>
        <td>${bill.billingType}</td>
        <td class="amount">$${bill.amount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-row">
    <div class="total-box">
      <div class="total-item">
        <span>Subtotal:</span>
        <span>$${bill.amount.toLocaleString()}</span>
      </div>
      <div class="total-item">
        <span>Taxes & Assessment:</span>
        <span>$0.00</span>
      </div>
      <div class="grand-total">
        <span>Total Due:</span>
        <span>$${bill.amount.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <div class="notes">
    <strong>Payment Instructions & Wire Details:</strong><br>
    ${billingSettings.bankDetails}<br><br>
    <strong>Terms & Conditions:</strong><br>
    ${billingSettings.paymentTerms}<br>
    ${billingSettings.lateFeeNotice}
  </div>

  <div class="footer">
    ${billingSettings.footerNote}<br>
    Generated securely by DOMUS OS Enterprise Studio
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Invoice_${bill.billNumber}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onTriggerNotification(
      'Invoice Downloaded',
      `Official invoice document for ${bill.billNumber} has been downloaded.`,
      'success'
    );
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || b.billingType === filterType;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left relative">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Invoiced</span>
            <h3 className="text-2xl font-mono font-bold text-white mt-1">
              ${totalInvoiced.toLocaleString()}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Aggregated billing ledger</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Collections</span>
            <h3 className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              ${totalCollected.toLocaleString()}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Settled receivables</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Outstanding</span>
            <h3 className="text-2xl font-mono font-bold text-rose-400 mt-1">
              ${totalOutstanding.toLocaleString()}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Unpaid & overdue accounts</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Recovery Rate</span>
            <h3 className="text-2xl font-mono font-bold text-white mt-1">
              {recoveryRate}%
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Capital recovery index</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-[#111114] border border-zinc-800 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 bg-[#141417] border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by customer, invoice #, or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Settings Menu Button for Admin to Change Billing Texts */}
            <button
              type="button"
              onClick={() => {
                setEditingSettings(billingSettings);
                setShowSettingsModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Configure company name, tax ID, payment terms, and invoice notes"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>Billing Settings</span>
            </button>

            {/* Issue New Invoice Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Invoice</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 bg-zinc-950/40 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Billing Category</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs border border-zinc-800 p-1.5 rounded bg-zinc-900 text-zinc-300 focus:outline-none"
            >
              <option value="all">All Properties (Rentals & Sales)</option>
              <option value="Rental">Rentals / Leases Only</option>
              <option value="Sold">Outright Sales / Installments</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Invoice Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs border border-zinc-800 p-1.5 rounded bg-zinc-900 text-zinc-300 focus:outline-none"
            >
              <option value="all">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoice Raising Form */}
        {showAddForm && (
          <div className="p-5 border-b border-zinc-800 bg-zinc-900/40 animate-fade-in text-left">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-zinc-400" /> Raise New Property Invoice
              </h4>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Target Apartment Unit</label>
                  <select
                    value={selectedApartmentId}
                    onChange={(e) => handleApartmentSelect(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                  >
                    <option value="">-- Choose Assigned Apartment --</option>
                    {apartments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.buildingName} - Unit {a.unitNumber} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Client / Tenant Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full client name"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@corporate.com"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Invoice Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 2500"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Billing Type</label>
                  <select
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                  >
                    <option value="Rental">Monthly Rental Lease</option>
                    <option value="Sold">Outright Sales Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Settlement Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Invoice Line Notes & Scope</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. November 2026 Monthly lease fee and community maintenance allocation."
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs p-2 rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-all cursor-pointer"
                >
                  Confirm & Dispatch Invoice
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoices Table */}
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No property invoices match your search or filter requirements.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#111114] text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Property & Unit</th>
                  <th className="p-4">Client / Tenant</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredBills.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-zinc-900/40 transition-colors">
                      {/* Invoice ID */}
                      <td className="p-4 font-mono font-medium text-white">
                        {b.billNumber}
                        <span className="block text-[10px] text-zinc-500 font-sans mt-0.5">
                          Issued: {b.issuedDate}
                        </span>
                      </td>

                      {/* Property */}
                      <td className="p-4">
                        <div className="font-semibold text-zinc-200">{b.buildingName}</div>
                        <div className="text-[10px] text-zinc-500">
                          Unit {b.unitNumber} • {b.billingType}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="p-4">
                        <div className="font-medium text-zinc-200">{b.customerName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{b.customerEmail}</div>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-mono font-bold text-white text-sm">
                        ${b.amount.toLocaleString()}
                      </td>

                      {/* Due Date */}
                      <td className="p-4 font-mono text-zinc-400">
                        {b.dueDate}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          b.status === 'Paid' 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60' 
                            : b.status === 'Overdue'
                            ? 'bg-rose-950/40 text-rose-400 border-rose-900/60'
                            : 'bg-amber-950/40 text-amber-400 border-amber-900/60'
                        }`}>
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {b.status !== 'Paid' && (
                            <>
                              {activePaymentId === b.id ? (
                                <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded border border-zinc-850 animate-fade-in text-left">
                                  <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300 p-1 rounded focus:outline-none"
                                  >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                  </select>
                                  <button
                                    onClick={() => handleConfirmPayment(b.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => setActivePaymentId(null)}
                                    className="text-zinc-500 hover:text-white cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setActivePaymentId(b.id)}
                                    className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-950 text-emerald-400 rounded text-[10px] font-bold cursor-pointer"
                                    title="Verify & record invoice payment"
                                  >
                                    Verify Payment
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateBill(b.id, { status: 'Overdue' });
                                      onTriggerNotification('Bill Overdue', `Bill ${b.billNumber} has been categorized as Overdue.`, 'warning');
                                    }}
                                    className="px-2 py-1 bg-rose-600/5 hover:bg-rose-600/15 border border-rose-950/40 text-rose-400 rounded text-[10px] font-medium cursor-pointer"
                                    title="Mark invoice as overdue"
                                  >
                                    Mark Overdue
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* REPLACED EMAIL PAYMENT WITH DOWNLOAD INVOICE (PDF) */}
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(b)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
                            title="Download invoice in PDF / Printable format"
                          >
                            <Download className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Download PDF</span>
                          </button>

                          {/* Delete Invoice */}
                          <button
                            onClick={() => {
                              if (confirm(`Deregister property invoice ${b.billNumber}?`)) {
                                onRemoveBill(b.id);
                                onTriggerNotification('Invoice Dropped', `Invoice ${b.billNumber} was dropped from registry records.`, 'error');
                              }
                            }}
                            className="p-1 text-zinc-600 hover:text-rose-500 hover:bg-rose-950/20 rounded border border-transparent hover:border-rose-950/30 cursor-pointer transition-all"
                            title="Drop invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1. OFFICIAL INVOICE PDF DOWNLOAD & PRINT PREVIEW MODAL        */}
      {/* ============================================================ */}
      {previewInvoice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in text-left overflow-y-auto"
          onClick={() => setPreviewInvoice(null)}
        >
          <div 
            className="bg-[#111114] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Toolbar */}
            <div className="p-4 bg-[#141417] border-b border-zinc-800 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Official Invoice Preview ({previewInvoice.billNumber})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoiceFile(previewInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Export invoice document"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet Body */}
            <div className="p-6 sm:p-8 space-y-6 bg-white text-zinc-900 font-sans print:p-0">
              {/* Header: Company Details & Invoice Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-zinc-900 pb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 uppercase font-sans">
                    {billingSettings.companyName}
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1">{billingSettings.companyAddress}</p>
                  <p className="text-xs text-zinc-600">{billingSettings.companyContact} • Tax ID: {billingSettings.taxId}</p>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 uppercase font-sans">
                    {billingSettings.invoiceTitle}
                  </h3>
                  <div className="mt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                      previewInvoice.status === 'Paid' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : previewInvoice.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {previewInvoice.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono mt-2">
                    Invoice No: <strong className="text-zinc-900">{previewInvoice.billNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Billed To & Invoice Schedule Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono block">
                    Billed Client / Tenant
                  </span>
                  <div className="font-bold text-zinc-900 text-sm">{previewInvoice.customerName}</div>
                  <div className="text-zinc-600 font-mono">{previewInvoice.customerEmail}</div>
                  <div className="text-zinc-700 pt-1 font-medium">
                    Property: {previewInvoice.buildingName}, Unit {previewInvoice.unitNumber} ({previewInvoice.propertyType})
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1 text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono block">
                    Invoice Dates & Terms
                  </span>
                  <div>Issued Date: <strong className="font-mono text-zinc-900">{previewInvoice.issuedDate}</strong></div>
                  <div>Payment Due: <strong className="font-mono text-rose-700">{previewInvoice.dueDate}</strong></div>
                  <div>Settlement Currency: <strong className="font-mono text-zinc-900">USD ($)</strong></div>
                  {previewInvoice.paymentMethod && (
                    <div className="text-emerald-700 font-medium">Payment Method: {previewInvoice.paymentMethod}</div>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-mono uppercase text-[10px]">
                      <th className="p-3 font-semibold">Description</th>
                      <th className="p-3 font-semibold">Property Space</th>
                      <th className="p-3 font-semibold">Billing Category</th>
                      <th className="p-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    <tr>
                      <td className="p-3">
                        <span className="font-semibold text-zinc-900 block">
                          {previewInvoice.description || `${previewInvoice.billingType} charge for ${previewInvoice.buildingName}`}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Unit {previewInvoice.unitNumber} scheduled assessment
                        </span>
                      </td>
                      <td className="p-3 font-medium">{previewInvoice.buildingName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-200/80 font-mono text-[10px] font-semibold text-zinc-800">
                          {previewInvoice.billingType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-950 text-sm">
                        ${previewInvoice.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">${previewInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Tax & Municipal Levy:</span>
                    <span className="font-mono font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between text-zinc-950 font-bold border-t border-zinc-300 pt-2 text-base">
                    <span>Total Due:</span>
                    <span className="font-mono text-emerald-800">${previewInvoice.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Wire Details & Legal Notes (From Admin Settings) */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2 text-zinc-700">
                <div>
                  <strong className="text-zinc-900 block mb-0.5">Payment Instructions & Wire Details:</strong>
                  <p className="font-mono text-[11px] text-zinc-800 bg-white p-2 rounded border border-zinc-200">
                    {billingSettings.bankDetails}
                  </p>
                </div>
                <div className="pt-1">
                  <strong className="text-zinc-900 block mb-0.5">Terms of Settlement:</strong>
                  <p className="text-[11px] leading-relaxed text-zinc-600">
                    {billingSettings.paymentTerms} {billingSettings.lateFeeNotice}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[11px] text-zinc-500 border-t border-zinc-200 pt-4 font-sans">
                <p>{billingSettings.footerNote}</p>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  DOMUS OS Enterprise Studio • Verified Secure Invoice Record
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ADMIN BILLING TEXT SETTINGS MODAL                          */}
      {/* ============================================================ */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in text-left overflow-y-auto"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="bg-[#111114] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Settings Header */}
            <div className="p-4 bg-[#141417] border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                  <Settings className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Billing & Invoice Settings</h3>
                  <p className="text-[11px] text-zinc-400">Configure company entity, invoice headers, wire instructions & notes</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              {/* Company Legal Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Company Legal Entity Name
                </label>
                <input 
                  type="text"
                  value={editingSettings.companyName}
                  onChange={(e) => setEditingSettings({ ...editingSettings, companyName: e.target.value })}
                  required
                  placeholder="e.g. DOMUS REAL ESTATE & INFRASTRUCTURE INC."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 font-sans"
                />
              </div>

              {/* Corporate Address & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Corporate Address
                  </label>
                  <input 
                    type="text"
                    value={editingSettings.companyAddress}
                    onChange={(e) => setEditingSettings({ ...editingSettings, companyAddress: e.target.value })}
                    required
                    placeholder="e.g. Suite 800, Horizon Executive Center"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Contact Email & Support
                  </label>
                  <input 
                    type="text"
                    value={editingSettings.companyContact}
                    onChange={(e) => setEditingSettings({ ...editingSettings, companyContact: e.target.value })}
                    required
                    placeholder="e.g. billing@domus-os.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Tax ID & Invoice Header Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Tax ID / VAT Registration #
                  </label>
                  <input 
                    type="text"
                    value={editingSettings.taxId}
                    onChange={(e) => setEditingSettings({ ...editingSettings, taxId: e.target.value })}
                    required
                    placeholder="e.g. US-EIN-984210984"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Invoice Document Title
                  </label>
                  <input 
                    type="text"
                    value={editingSettings.invoiceTitle}
                    onChange={(e) => setEditingSettings({ ...editingSettings, invoiceTitle: e.target.value })}
                    required
                    placeholder="e.g. OFFICIAL PROPERTY TAX INVOICE"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 uppercase"
                  />
                </div>
              </div>

              {/* Bank Wire Details */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Bank Settlement & Wire Transfer Instructions
                </label>
                <textarea 
                  rows={2}
                  value={editingSettings.bankDetails}
                  onChange={(e) => setEditingSettings({ ...editingSettings, bankDetails: e.target.value })}
                  required
                  placeholder="Bank name, account number, routing number, swift code..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono text-[11px]"
                />
              </div>

              {/* Payment Terms & Late Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Payment Terms Policy
                  </label>
                  <textarea 
                    rows={2}
                    value={editingSettings.paymentTerms}
                    onChange={(e) => setEditingSettings({ ...editingSettings, paymentTerms: e.target.value })}
                    placeholder="e.g. Payment due within 30 days of issuance."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Late Payment Policy
                  </label>
                  <textarea 
                    rows={2}
                    value={editingSettings.lateFeeNotice}
                    onChange={(e) => setEditingSettings({ ...editingSettings, lateFeeNotice: e.target.value })}
                    placeholder="e.g. Late payments incur a 1.5% interest charge per month."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 text-[11px]"
                  />
                </div>
              </div>

              {/* Custom Footer Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Invoice Footer Disclaimer & Notes
                </label>
                <input 
                  type="text"
                  value={editingSettings.footerNote}
                  onChange={(e) => setEditingSettings({ ...editingSettings, footerNote: e.target.value })}
                  placeholder="e.g. Thank you for your partnership. Contact accounts@domus-os.com for billing queries."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 text-[11px]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded hover:bg-zinc-900 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-3.5 py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Billing Texts</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
