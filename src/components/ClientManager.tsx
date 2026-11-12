/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Bill, Apartment, Project, SystemUserProfile } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Building2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  X, 
  Receipt, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  TrendingUp, 
  Award, 
  Download, 
  CreditCard,
  Building,
  UserCheck,
  Send,
  Eye,
  Check
} from 'lucide-react';

interface ClientManagerProps {
  clients: Client[];
  bills: Bill[];
  apartments: Apartment[];
  projects: Project[];
  currentUserRole?: string;
  onAddClient: (client: Client, initialBill?: Partial<Bill>) => void;
  onUpdateClient: (id: string, updates: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  onAssignBill: (bill: Bill) => void;
  onUpdateBill?: (id: string, updates: Partial<Bill>) => void;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  bills,
  apartments,
  projects,
  currentUserRole,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAssignBill,
  onUpdateBill,
  onTriggerNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgreement, setFilterAgreement] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [billModalClient, setBillModalClient] = useState<Client | null>(null);
  const [viewBillsClient, setViewBillsClient] = useState<Client | null>(null);

  // Form State: Add / Edit Client
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formApartmentId, setFormApartmentId] = useState('');
  const [formAgreementType, setFormAgreementType] = useState<'Sold' | 'Rental'>('Rental');
  const [formContractValue, setFormContractValue] = useState('');
  const [formMonthlyRent, setFormMonthlyRent] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Pending Agreement' | 'Completed'>('Active');
  const [formNotes, setFormNotes] = useState('');

  // Initial Bill on Add Client
  const [formGenerateBill, setFormGenerateBill] = useState(true);
  const [formInitialBillAmount, setFormInitialBillAmount] = useState('');
  const [formInitialBillDueDate, setFormInitialBillDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [formInitialBillDesc, setFormInitialBillDesc] = useState('Initial contract deposit and booking fee.');

  // Assign Bill Modal State
  const [assignAmount, setAssignAmount] = useState('');
  const [assignDueDate, setAssignDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [assignCategory, setAssignCategory] = useState<'Rental' | 'Sold'>('Rental');
  const [assignDescription, setAssignDescription] = useState('Monthly rental charge invoice.');

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const totalContractValue = clients.reduce((sum, c) => sum + (c.contractValue || 0), 0);

    // Sum client bills
    const clientEmails = new Set(clients.map(c => c.email.toLowerCase()));
    const clientNames = new Set(clients.map(c => c.name.toLowerCase()));

    const relatedBills = bills.filter(b => 
      clientEmails.has((b.customerEmail || '').toLowerCase()) ||
      clientNames.has((b.customerName || '').toLowerCase())
    );

    const totalInvoiced = relatedBills.reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = relatedBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0);
    const totalOutstanding = relatedBills.filter(b => b.status !== 'Paid').reduce((sum, b) => sum + b.amount, 0);

    return {
      totalClients,
      activeClients,
      totalContractValue,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalBillsCount: relatedBills.length
    };
  }, [clients, bills]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        (client.companyOrAddress && client.companyOrAddress.toLowerCase().includes(q)) ||
        (client.buildingName && client.buildingName.toLowerCase().includes(q)) ||
        (client.unitNumber && client.unitNumber.toLowerCase().includes(q))
      );

      // Agreement filter
      const matchesAgreement = filterAgreement === 'all' || client.agreementType === filterAgreement;

      // Status filter
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;

      return matchesSearch && matchesAgreement && matchesStatus;
    });
  }, [clients, searchQuery, filterAgreement, filterStatus]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormApartmentId(apartments[0]?.id || '');
    setFormAgreementType('Rental');
    const apt = apartments[0];
    setFormContractValue(apt ? (apt.monthlyRent ? (apt.monthlyRent * 12).toString() : '24000') : '24000');
    setFormMonthlyRent(apt?.monthlyRent?.toString() || '2000');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
    setFormStatus('Active');
    setFormNotes('');
    setFormGenerateBill(true);
    setFormInitialBillAmount(apt?.monthlyRent?.toString() || '2000');
    setFormInitialBillDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setFormInitialBillDesc('First month lease installment and security retainer.');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormCompany(client.companyOrAddress || '');
    setFormApartmentId(client.assignedApartmentId || '');
    setFormAgreementType(client.agreementType);
    setFormContractValue(client.contractValue.toString());
    setFormMonthlyRent(client.monthlyRent ? client.monthlyRent.toString() : '');
    setFormStartDate(client.startDate);
    setFormEndDate(client.endDate || '');
    setFormStatus(client.status);
    setFormNotes(client.notes || '');
  };

  // Open Assign Bill Modal for a specific client
  const handleOpenAssignBillModal = (client: Client) => {
    setBillModalClient(client);
    setAssignCategory(client.agreementType);
    setAssignAmount(
      client.agreementType === 'Rental' 
        ? (client.monthlyRent?.toString() || '2000') 
        : (client.contractValue ? Math.round(client.contractValue * 0.1).toString() : '10000')
    );
    setAssignDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setAssignDescription(
      client.agreementType === 'Rental'
        ? `Monthly rental charge for Unit ${client.unitNumber || ''} at ${client.buildingName || 'Property'}.`
        : `Milestone installment invoice for Unit ${client.unitNumber || ''} at ${client.buildingName || 'Property'}.`
    );
  };

  // Submit Add / Edit Client
  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('Please provide at least a Client Name and Phone number.');
      return;
    }

    const assignedApt = apartments.find(a => a.id === formApartmentId);
    const contractVal = parseFloat(formContractValue) || (assignedApt?.price || 0);
    const monthlyVal = formAgreementType === 'Rental' ? (parseFloat(formMonthlyRent) || Math.round(contractVal / 12)) : undefined;

    if (editingClient) {
      onUpdateClient(editingClient.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        companyOrAddress: formCompany.trim(),
        assignedApartmentId: formApartmentId || undefined,
        buildingName: assignedApt?.buildingName || editingClient.buildingName,
        unitNumber: assignedApt?.unitNumber || editingClient.unitNumber,
        propertyType: assignedApt?.type || editingClient.propertyType,
        agreementType: formAgreementType,
        contractValue: contractVal,
        monthlyRent: monthlyVal,
        startDate: formStartDate,
        endDate: formEndDate,
        status: formStatus,
        notes: formNotes.trim()
      });

      onTriggerNotification('Client Updated', `Client record for "${formName}" was updated.`, 'info');
      setEditingClient(null);
    } else {
      const newClientId = `CLI-${Math.floor(100 + Math.random() * 900)}`;
      const newClient: Client = {
        id: newClientId,
        name: formName.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
        phone: formPhone.trim(),
        companyOrAddress: formCompany.trim(),
        assignedApartmentId: formApartmentId || undefined,
        buildingName: assignedApt?.buildingName || 'Grand Horizon Towers',
        unitNumber: assignedApt?.unitNumber || 'Unit 101',
        propertyType: assignedApt?.type || 'Residential Apartment',
        agreementType: formAgreementType,
        contractValue: contractVal,
        monthlyRent: monthlyVal,
        startDate: formStartDate,
        endDate: formEndDate,
        status: formStatus,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString().split('T')[0]
      };

      let initialBillData: Partial<Bill> | undefined;
      if (formGenerateBill && formInitialBillAmount) {
        initialBillData = {
          amount: parseFloat(formInitialBillAmount) || (monthlyVal || contractVal),
          dueDate: formInitialBillDueDate,
          description: formInitialBillDesc || `${formAgreementType} initial agreement invoice.`
        };
      }

      onAddClient(newClient, initialBillData);
      onTriggerNotification(
        'Client Registered',
        `Client "${newClient.name}" was registered and allocated ${newClient.buildingName} ${newClient.unitNumber}.`,
        'success'
      );
      setShowAddModal(false);
    }
  };

  // Submit Assign Bill
  const handleSubmitAssignBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billModalClient) return;

    const amt = parseFloat(assignAmount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid invoice amount.');
      return;
    }

    const newBill: Bill = {
      id: `BIL-${Math.floor(500 + Math.random() * 500)}`,
      billNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      apartmentId: billModalClient.assignedApartmentId || 'APT-101',
      buildingName: billModalClient.buildingName || 'Grand Horizon Towers',
      unitNumber: billModalClient.unitNumber || 'Unit 101',
      propertyType: billModalClient.propertyType || 'Apartment',
      billingType: assignCategory,
      customerName: billModalClient.name,
      customerEmail: billModalClient.email,
      amount: amt,
      dueDate: assignDueDate,
      issuedDate: new Date().toISOString().split('T')[0],
      status: 'Unpaid',
      paymentMethod: 'Bank Transfer',
      description: assignDescription.trim() || `Invoice assigned to ${billModalClient.name}.`
    };

    onAssignBill(newBill);
    onTriggerNotification(
      'Invoice Assigned',
      `Invoice ${newBill.billNumber} ($${amt.toLocaleString()}) assigned to client "${billModalClient.name}".`,
      'success'
    );
    setBillModalClient(null);
  };

  // Helper: Get bills for a client
  const getClientBills = (client: Client) => {
    return bills.filter(b => 
      b.customerEmail?.toLowerCase() === client.email.toLowerCase() ||
      b.customerName?.toLowerCase() === client.name.toLowerCase()
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-[#111114] border border-zinc-800 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider bg-purple-950/70 border border-purple-800 text-purple-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Client Portfolio & Invoicing
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-300">
                Cross-Role Directory
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-purple-400" />
              Clients Directory & Billing Management
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Register corporate real estate clients, manage active leases and purchased units, assign invoices directly to clients, and verify client portal billing synchronization in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-950 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Client
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white">{kpis.totalClients}</div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{kpis.activeClients} active</span> tenancies
          </div>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Contracted Portfolio</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            ${(kpis.totalContractValue / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Total active agreement value
          </div>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Total Invoices</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{kpis.totalBillsCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            ${(kpis.totalInvoiced / 1000).toFixed(1)}k assigned
          </div>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Collected Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">${kpis.totalPaid.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Paid invoices
          </div>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-lg p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Outstanding Due</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">${kpis.totalOutstanding.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Pending client payment
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111114] border border-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, email, phone, company, unit..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span>Agreement:</span>
              <select
                value={filterAgreement}
                onChange={(e) => setFilterAgreement(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 focus:outline-none"
              >
                <option value="all">All Agreements</option>
                <option value="Rental">Rental / Lease</option>
                <option value="Sold">Property Purchase / Sale</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending Agreement">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-[#111114] border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Client Identity</th>
                <th className="py-3 px-4">Property Holding</th>
                <th className="py-3 px-4">Agreement Terms</th>
                <th className="py-3 px-4">Assigned Bills / Invoices</th>
                <th className="py-3 px-4">Status & Portal</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-zinc-600" />
                      <span className="text-sm">No clients found matching the search criteria.</span>
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
                      >
                        + Add a new client
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientBills = getClientBills(client);
                  const unpaidBills = clientBills.filter(b => b.status !== 'Paid');
                  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);

                  return (
                    <tr key={client.id} className="hover:bg-zinc-900/40 transition-colors group">
                      {/* Identity */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                              {client.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {client.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                            <Phone className="w-3 h-3 text-purple-400 shrink-0" />
                            <a href={`tel:${client.phone}`} className="hover:underline font-mono">
                              {client.phone}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                            <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                            <a href={`mailto:${client.email}`} className="hover:underline truncate max-w-[190px]">
                              {client.email}
                            </a>
                          </div>

                          {client.companyOrAddress && (
                            <div className="flex items-start gap-1 text-zinc-500 text-[10px] pt-0.5">
                              <MapPin className="w-3 h-3 text-zinc-600 shrink-0 mt-0.5" />
                              <span className="truncate max-w-[200px]" title={client.companyOrAddress}>
                                {client.companyOrAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Property Holding */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{client.buildingName || 'Assigned Property'}</span>
                          </div>
                          <div className="text-[11px] font-mono text-purple-300 font-bold">
                            {client.unitNumber || 'Unit'} <span className="text-zinc-500 font-normal">({client.propertyType || 'Apartment'})</span>
                          </div>
                          <span className={`inline-block text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                            client.agreementType === 'Sold' 
                              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400' 
                              : 'bg-blue-950/60 border border-blue-800 text-blue-400'
                          }`}>
                            {client.agreementType === 'Sold' ? 'Purchased Unit' : 'Leased Unit'}
                          </span>
                        </div>
                      </td>

                      {/* Agreement Terms */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white font-mono">
                            ${client.contractValue.toLocaleString()}
                          </div>
                          {client.monthlyRent && (
                            <div className="text-[11px] font-mono text-emerald-400">
                              ${client.monthlyRent.toLocaleString()} / month
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500">
                            {client.startDate} {client.endDate ? `to ${client.endDate}` : ''}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Bills */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          {clientBills.length > 0 ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-200 text-xs">
                                  {clientBills.length} Bill{clientBills.length > 1 ? 's' : ''}
                                </span>
                                {unpaidBills.length > 0 ? (
                                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 rounded font-bold">
                                    ${unpaidTotal.toLocaleString()} Due
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> All Settled
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setViewBillsClient(client)}
                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer mt-0.5 block"
                              >
                                View {clientBills.length} Invoices &rarr;
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-600 italic">No bills assigned yet</span>
                          )}

                          {/* Quick Assign Bill Button */}
                          <button
                            onClick={() => handleOpenAssignBillModal(client)}
                            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/80 px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors w-fit"
                          >
                            <Plus className="w-3 h-3" /> Assign Bill
                          </button>
                        </div>
                      </td>

                      {/* Status & Portal */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            client.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                            client.status === 'Pending Agreement' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                            'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {client.status}
                          </span>
                          <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Client Portal Active
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAssignBillModal(client)}
                            className="p-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800 rounded transition-colors cursor-pointer"
                            title="Assign New Bill / Invoice to this Client"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(client)}
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-colors cursor-pointer"
                            title="Edit Client Information"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingClient(client)}
                            className="p-1.5 bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded border border-zinc-800 transition-colors cursor-pointer"
                            title="Remove Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: ADD / EDIT CLIENT                                    */}
      {/* ============================================================ */}
      {(showAddModal || editingClient) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  {editingClient ? `Edit Client: ${editingClient.name}` : 'Register New Client'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Allocate built units, establish lease/purchase terms, and generate initial billing records.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingClient(null);
                }}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClient} className="space-y-4">
              {/* Row 1: Name, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Client Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jonathan Hayes"
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 345-6789"
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Row 2: Email & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Client Email (Portal Login) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. j.hayes@client.com"
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Company / Residence Address
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Hayes Technology Partners, Suite 120"
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Row 3: Assigned Property & Agreement Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Assign Property / Apartment Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formApartmentId}
                    onChange={(e) => {
                      setFormApartmentId(e.target.value);
                      const apt = apartments.find(a => a.id === e.target.value);
                      if (apt) {
                        if (formAgreementType === 'Rental') {
                          setFormMonthlyRent(apt.monthlyRent?.toString() || '2000');
                          setFormContractValue(apt.monthlyRent ? (apt.monthlyRent * 12).toString() : '24000');
                          setFormInitialBillAmount(apt.monthlyRent?.toString() || '2000');
                        } else {
                          setFormContractValue(apt.price?.toString() || '500000');
                          setFormInitialBillAmount(Math.round((apt.price || 500000) * 0.1).toString());
                        }
                      }
                    }}
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select Property Unit</option>
                    {apartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.buildingName} - Unit {apt.unitNumber} ({apt.type}, Status: {apt.status}, Price: ${apt.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Agreement Type
                  </label>
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormAgreementType('Rental')}
                      className={`flex-1 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                        formAgreementType === 'Rental' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Rental / Lease
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAgreementType('Sold')}
                      className={`flex-1 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                        formAgreementType === 'Sold' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Property Purchase (Sold)
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Financial Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Total Contract Value ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={formContractValue}
                      onChange={(e) => setFormContractValue(e.target.value)}
                      placeholder="e.g. 24000"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {formAgreementType === 'Rental' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                      Monthly Recurring Rent ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="number"
                        min="0"
                        value={formMonthlyRent}
                        onChange={(e) => setFormMonthlyRent(e.target.value)}
                        placeholder="e.g. 2000"
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Dates and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Agreement Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Agreement End Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Client Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Agreement">Pending Agreement</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Initial Bill Checkbox for New Client */}
              {!editingClient && (
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={formGenerateBill}
                      onChange={(e) => setFormGenerateBill(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    <span>Issue Initial Invoice to Client Immediately</span>
                  </label>
                  
                  {formGenerateBill && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Initial Bill Amount ($)
                        </label>
                        <input
                          type="number"
                          value={formInitialBillAmount}
                          onChange={(e) => setFormInitialBillAmount(e.target.value)}
                          placeholder="e.g. 2000"
                          className="w-full text-xs font-mono bg-[#111114] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Payment Due Date
                        </label>
                        <input
                          type="date"
                          value={formInitialBillDueDate}
                          onChange={(e) => setFormInitialBillDueDate(e.target.value)}
                          className="w-full text-xs font-mono bg-[#111114] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Agreement Terms & Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Record deed conditions, parking bay allocation, security deposit terms..."
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-purple-950 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingClient ? 'Update Client' : 'Save & Allocate Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ASSIGN BILL TO CLIENT                                */}
      {/* ============================================================ */}
      {billModalClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  Assign Bill to {billModalClient.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Assigned Unit: <span className="text-zinc-200 font-bold">{billModalClient.buildingName} - {billModalClient.unitNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setBillModalClient(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignBill} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Billing Category
                  </label>
                  <select
                    value={assignCategory}
                    onChange={(e) => setAssignCategory(e.target.value as any)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Rental">Rental Monthly Fee</option>
                    <option value="Sold">Purchase Installment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Invoice Amount ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={assignAmount}
                      onChange={(e) => setAssignAmount(e.target.value)}
                      placeholder="e.g. 1800"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Payment Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Bill Description / Narrative
                </label>
                <textarea
                  rows={2}
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  placeholder="e.g. Monthly rental charge for unit 1204..."
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-lg text-[11px] text-purple-300/90 leading-relaxed">
                <span className="font-bold text-purple-400">Portal Sync:</span> This invoice will instantly appear on {billModalClient.name}'s verified Client Workspace dashboard with pay options.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setBillModalClient(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-purple-950 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Issue & Assign Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: VIEW CLIENT BILLS HISTORY                           */}
      {/* ============================================================ */}
      {viewBillsClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  Invoices for {viewBillsClient.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {viewBillsClient.email} | {viewBillsClient.buildingName} - {viewBillsClient.unitNumber}
                </p>
              </div>
              <button
                onClick={() => setViewBillsClient(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {getClientBills(viewBillsClient).length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs italic">
                  No invoices issued to this client yet.
                </div>
              ) : (
                getClientBills(viewBillsClient).map((bill) => (
                  <div key={bill.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{bill.billNumber}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          bill.status === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">{bill.description}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">Due: {bill.dueDate}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono">${bill.amount.toLocaleString()}</div>
                      {bill.paymentMethod && (
                        <div className="text-[10px] text-zinc-500">{bill.paymentMethod}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  const targetClient = viewBillsClient;
                  setViewBillsClient(null);
                  handleOpenAssignBillModal(targetClient);
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Assign New Bill
              </button>

              <button
                onClick={() => setViewBillsClient(null)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: DELETE CONFIRMATION                                 */}
      {/* ============================================================ */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-rose-900/60 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Remove Client Record</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">"{deletingClient.name}"</span> ({deletingClient.email}) from the active client registry?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(deletingClient.id);
                  onTriggerNotification('Client Removed', `Client "${deletingClient.name}" was removed.`, 'warning');
                  setDeletingClient(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
