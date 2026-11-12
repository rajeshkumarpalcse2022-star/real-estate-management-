/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Star, 
  Phone, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  X, 
  Search, 
  Truck, 
  Wrench, 
  HardHat,
  Gavel,
  ShieldCheck,
  DollarSign,
  Pencil,
  ChevronDown,
  ChevronUp,
  Tag,
  Zap,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Vendor, VendorContract, Tender, Bid, Project } from '../types';

interface VendorManagerProps {
  vendors: Vendor[];
  onAddVendor: (v: Vendor) => void;
  onRemoveVendor: (id: string) => void;
  onUpdateVendor: (id: string, fields: Partial<Vendor>) => void;
  onTriggerNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  isBasicPlan?: boolean;
  tenders?: Tender[];
  onAddTender?: (t: Tender) => void;
  onUpdateTender?: (id: string, updatedFields: Partial<Tender>) => void;
  onAddBid?: (tenderId: string, b: Bid) => void;
  projects?: Project[];
}

const DEFAULT_SUPPLY_TYPES: string[] = [
  'Material Supplier',
  'Machinery Supplier',
  'Labour Contractor',
  'Electrical & Utilities',
  'Plumbing & HVAC',
  'Logistics & Hauling',
  'Safety & Scaffolding',
  'Interior & Glazing'
];

export const VendorManager: React.FC<VendorManagerProps> = ({
  vendors,
  onAddVendor,
  onRemoveVendor,
  onUpdateVendor,
  onTriggerNotification,
  tenders = [],
  onAddTender,
  onUpdateTender,
  onAddBid,
  projects = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'tenders'>('directory');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Custom Contract / Supply Types state (persisted in localStorage)
  const [supplyTypes, setSupplyTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('domus_vendor_contract_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_SUPPLY_TYPES;
  });

  const [showTypeManagerModal, setShowTypeManagerModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeOriginal, setEditingTypeOriginal] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');

  // Expandable contract drawers per vendor
  const [expandedVendorContracts, setExpandedVendorContracts] = useState<Record<string, boolean>>({});

  // Contract Costing Modals
  const [contractModalState, setContractModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    vendorId: string;
    contract?: VendorContract;
  }>({
    isOpen: false,
    mode: 'add',
    vendorId: '',
  });

  const [contractFormTitle, setContractFormTitle] = useState('');
  const [contractFormType, setContractFormType] = useState('');
  const [contractFormCost, setContractFormCost] = useState('');
  const [contractFormBilling, setContractFormBilling] = useState('Milestone');
  const [contractFormStartDate, setContractFormStartDate] = useState('');
  const [contractFormEndDate, setContractFormEndDate] = useState('');
  const [contractFormStatus, setContractFormStatus] = useState<VendorContract['status']>('Active');
  const [contractFormNotes, setContractFormNotes] = useState('');

  // Edit Vendor Modal
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorType, setEditVendorType] = useState('');
  const [editVendorCustomType, setEditVendorCustomType] = useState('');
  const [editVendorContact, setEditVendorContact] = useState('');
  const [editVendorPhone, setEditVendorPhone] = useState('');
  const [editVendorEmail, setEditVendorEmail] = useState('');
  const [editVendorSuppliedItems, setEditVendorSuppliedItems] = useState('');
  const [editVendorStatus, setEditVendorStatus] = useState<Vendor['status']>('Active');
  const [editVendorRating, setEditVendorRating] = useState(5);

  // Add Vendor Form States
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(DEFAULT_SUPPLY_TYPES[0]);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [suppliedItemsRaw, setSuppliedItemsRaw] = useState('');
  const [status, setStatus] = useState<Vendor['status']>('Active');
  const [rating, setRating] = useState(5);
  const [initialContractTitle, setInitialContractTitle] = useState('');
  const [initialContractCost, setInitialContractCost] = useState('');

  // Tender Creation Form State
  const [showAddTenderForm, setShowAddTenderForm] = useState(false);
  const [newTenderTitle, setNewTenderTitle] = useState('');
  const [newTenderDesc, setNewTenderDesc] = useState('');
  const [newTenderBudget, setNewTenderBudget] = useState('');
  const [newTenderDueDate, setNewTenderDueDate] = useState('');
  const [newTenderProject, setNewTenderProject] = useState('');
  const [newTenderCategory, setNewTenderCategory] = useState('Raw Materials');

  // Bid Creation Form State
  const [showAddBidId, setShowAddBidId] = useState<string | null>(null);
  const [newBidVendorName, setNewBidVendorName] = useState('');
  const [newBidAmount, setNewBidAmount] = useState('');
  const [newBidDeliveryDays, setNewBidDeliveryDays] = useState('');
  const [newBidProposal, setNewBidProposal] = useState('');

  // Save supplyTypes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('domus_vendor_contract_types', JSON.stringify(supplyTypes));
    } catch {
      // ignore
    }
  }, [supplyTypes]);

  // Aggregate metrics
  const totalVendors = vendors.length;
  const activeCount = vendors.filter(v => v.status === 'Active').length;
  
  // Total Contract Cost calculation
  const totalContractValue = vendors.reduce((sum, v) => {
    if (v.contracts && v.contracts.length > 0) {
      return sum + v.contracts.reduce((cSum, c) => cSum + (c.cost || 0), 0);
    }
    return sum + (v.contractCost || 0);
  }, 0);

  const totalContracts = vendors.reduce((sum, v) => {
    if (v.contracts && v.contracts.length > 0) {
      return sum + v.contracts.length;
    }
    return sum + (v.activeContractsCount || 0);
  }, 0);

  const averageRating = vendors.length > 0 
    ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1) 
    : '0.0';

  // Helper to get total cost of a specific vendor
  const getVendorTotalCost = (v: Vendor): number => {
    if (v.contracts && v.contracts.length > 0) {
      return v.contracts.reduce((sum, c) => sum + (c.cost || 0), 0);
    }
    return v.contractCost || 0;
  };

  // Supply Types Management Handlers
  const handleAddSupplyType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (supplyTypes.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      onTriggerNotification('Type Exists', `"${trimmed}" is already present in supply types.`, 'warning');
      return;
    }
    const updated = [...supplyTypes, trimmed];
    setSupplyTypes(updated);
    setNewTypeName('');
    onTriggerNotification('Supply Type Created', `Added "${trimmed}" to available contract/supply types.`, 'success');
  };

  const handleStartEditType = (t: string) => {
    setEditingTypeOriginal(t);
    setEditingTypeName(t);
  };

  const handleSaveEditType = () => {
    if (!editingTypeOriginal) return;
    const trimmed = editingTypeName.trim();
    if (!trimmed) return;
    
    // Update supplyTypes
    const updated = supplyTypes.map(t => (t === editingTypeOriginal ? trimmed : t));
    setSupplyTypes(updated);

    // Also update any vendor who had this type
    vendors.forEach(v => {
      let changed = false;
      const updates: Partial<Vendor> = {};
      if (v.type === editingTypeOriginal) {
        updates.type = trimmed;
        changed = true;
      }
      if (v.contracts && v.contracts.some(c => c.contractType === editingTypeOriginal)) {
        updates.contracts = v.contracts.map(c => 
          c.contractType === editingTypeOriginal ? { ...c, contractType: trimmed } : c
        );
        changed = true;
      }
      if (changed) {
        onUpdateVendor(v.id, updates);
      }
    });

    setEditingTypeOriginal(null);
    setEditingTypeName('');
    onTriggerNotification('Supply Type Renamed', `Renamed type to "${trimmed}" across all records.`, 'success');
  };

  const handleDeleteSupplyType = (typeToDelete: string) => {
    if (supplyTypes.length <= 1) {
      onTriggerNotification('Action Prohibited', 'You must maintain at least one supply/contract type.', 'error');
      return;
    }
    const affectedCount = vendors.filter(v => v.type === typeToDelete).length;
    const confirmMessage = affectedCount > 0
      ? `Delete supply type "${typeToDelete}"? Note: ${affectedCount} vendor(s) are currently categorized under it.`
      : `Delete supply type "${typeToDelete}"?`;

    if (!confirm(confirmMessage)) return;

    const updated = supplyTypes.filter(t => t !== typeToDelete);
    setSupplyTypes(updated);
    if (filterType === typeToDelete) {
      setFilterType('all');
    }
    onTriggerNotification('Supply Type Deleted', `Removed "${typeToDelete}" from contract types.`, 'info');
  };

  // Add Vendor Handler
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !phone || !email || !suppliedItemsRaw) return;

    const effectiveType = type === '__custom__' ? customTypeInput.trim() : type;
    if (!effectiveType) {
      onTriggerNotification('Invalid Type', 'Please provide a contract/supply type.', 'error');
      return;
    }

    // Auto-save new custom type if not yet present
    if (!supplyTypes.includes(effectiveType)) {
      setSupplyTypes(prev => [...prev, effectiveType]);
    }

    const suppliedItems = suppliedItemsRaw
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const initialCostNum = Number(initialContractCost) || 0;
    const initialContracts: VendorContract[] = initialCostNum > 0 || initialContractTitle ? [
      {
        id: `CTR-${Math.floor(100 + Math.random() * 900)}-INIT`,
        contractTitle: initialContractTitle || `${effectiveType} Base Contract`,
        contractType: effectiveType,
        cost: initialCostNum,
        startDate: new Date().toISOString().split('T')[0],
        billingFrequency: 'Monthly',
        status: 'Active',
        notes: `Initial master agreement for ${suppliedItems[0] || 'supply deliveries'}`
      }
    ] : [];

    const newVendor: Vendor = {
      id: `VND-${Math.floor(100 + Math.random() * 900)}`,
      name,
      type: effectiveType,
      contactPerson,
      phone,
      email,
      suppliedItems,
      status,
      rating: Number(rating),
      activeContractsCount: initialContracts.length > 0 ? initialContracts.length : 1,
      contractCost: initialCostNum,
      contracts: initialContracts
    };

    onAddVendor(newVendor);
    onTriggerNotification(
      'New Logistics Partner',
      `Registered vendor "${newVendor.name}" (${effectiveType}) with $${initialCostNum.toLocaleString()} contract cost.`,
      'success'
    );

    setShowAddForm(false);
    // Reset fields
    setName('');
    setType(supplyTypes[0] || 'Material Supplier');
    setCustomTypeInput('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setSuppliedItemsRaw('');
    setStatus('Active');
    setRating(5);
    setInitialContractTitle('');
    setInitialContractCost('');
  };

  // Edit Vendor Handler
  const handleOpenEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setEditVendorName(v.name);
    if (supplyTypes.includes(v.type)) {
      setEditVendorType(v.type);
      setEditVendorCustomType('');
    } else {
      setEditVendorType('__custom__');
      setEditVendorCustomType(v.type);
    }
    setEditVendorContact(v.contactPerson);
    setEditVendorPhone(v.phone);
    setEditVendorEmail(v.email);
    setEditVendorSuppliedItems(v.suppliedItems.join(', '));
    setEditVendorStatus(v.status);
    setEditVendorRating(v.rating);
  };

  const handleSaveEditVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;

    const finalType = editVendorType === '__custom__' ? editVendorCustomType.trim() : editVendorType;
    if (!finalType) {
      onTriggerNotification('Invalid Type', 'Please specify a valid contract/supply type.', 'error');
      return;
    }

    if (!supplyTypes.includes(finalType)) {
      setSupplyTypes(prev => [...prev, finalType]);
    }

    const items = editVendorSuppliedItems
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    onUpdateVendor(editingVendor.id, {
      name: editVendorName,
      type: finalType,
      contactPerson: editVendorContact,
      phone: editVendorPhone,
      email: editVendorEmail,
      suppliedItems: items,
      status: editVendorStatus,
      rating: editVendorRating
    });

    onTriggerNotification('Vendor Updated', `Saved profile modifications for "${editVendorName}".`, 'success');
    setEditingVendor(null);
  };

  // Contract Costing Management (Add / Edit / Delete Contracts)
  const handleOpenAddContract = (vendor: Vendor) => {
    setContractModalState({
      isOpen: true,
      mode: 'add',
      vendorId: vendor.id
    });
    setContractFormTitle(`${vendor.name} Agreement`);
    setContractFormType(vendor.type);
    setContractFormCost('');
    setContractFormBilling('Milestone');
    setContractFormStartDate(new Date().toISOString().split('T')[0]);
    setContractFormEndDate('');
    setContractFormStatus('Active');
    setContractFormNotes('');
  };

  const handleOpenEditContract = (vendorId: string, contract: VendorContract) => {
    setContractModalState({
      isOpen: true,
      mode: 'edit',
      vendorId,
      contract
    });
    setContractFormTitle(contract.contractTitle);
    setContractFormType(contract.contractType || supplyTypes[0]);
    setContractFormCost(contract.cost ? String(contract.cost) : '0');
    setContractFormBilling(contract.billingFrequency || 'Milestone');
    setContractFormStartDate(contract.startDate || '');
    setContractFormEndDate(contract.endDate || '');
    setContractFormStatus(contract.status || 'Active');
    setContractFormNotes(contract.notes || '');
  };

  const handleSaveContractCosting = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === contractModalState.vendorId);
    if (!vendor) return;

    const costNum = Number(contractFormCost) || 0;
    const existingContracts: VendorContract[] = vendor.contracts ? [...vendor.contracts] : (
      vendor.contractCost ? [{
        id: `CTR-${vendor.id}-LEGACY`,
        contractTitle: `${vendor.name} Master Agreement`,
        contractType: vendor.type,
        cost: vendor.contractCost,
        startDate: '2026-01-01',
        billingFrequency: 'Monthly',
        status: 'Active'
      }] : []
    );

    let updatedContracts: VendorContract[] = [];

    if (contractModalState.mode === 'add') {
      const newContract: VendorContract = {
        id: `CTR-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`,
        contractTitle: contractFormTitle || `${contractFormType} Contract`,
        contractType: contractFormType || vendor.type,
        cost: costNum,
        startDate: contractFormStartDate || new Date().toISOString().split('T')[0],
        endDate: contractFormEndDate || undefined,
        billingFrequency: contractFormBilling,
        status: contractFormStatus,
        notes: contractFormNotes || undefined
      };
      updatedContracts = [newContract, ...existingContracts];
      onTriggerNotification(
        'Contract Costing Added',
        `Added contract "${newContract.contractTitle}" ($${costNum.toLocaleString()}) to ${vendor.name}.`,
        'success'
      );
    } else if (contractModalState.mode === 'edit' && contractModalState.contract) {
      const targetId = contractModalState.contract.id;
      updatedContracts = existingContracts.map(c => {
        if (c.id === targetId) {
          return {
            ...c,
            contractTitle: contractFormTitle,
            contractType: contractFormType,
            cost: costNum,
            startDate: contractFormStartDate,
            endDate: contractFormEndDate || undefined,
            billingFrequency: contractFormBilling,
            status: contractFormStatus,
            notes: contractFormNotes
          };
        }
        return c;
      });
      onTriggerNotification(
        'Contract Costing Updated',
        `Updated contract "${contractFormTitle}" ($${costNum.toLocaleString()}) on ${vendor.name}.`,
        'success'
      );
    }

    const newTotalCost = updatedContracts.reduce((sum, c) => sum + (c.cost || 0), 0);
    const newActiveCount = updatedContracts.filter(c => c.status === 'Active').length;

    onUpdateVendor(vendor.id, {
      contracts: updatedContracts,
      contractCost: newTotalCost,
      activeContractsCount: newActiveCount > 0 ? newActiveCount : updatedContracts.length
    });

    setContractModalState({ isOpen: false, mode: 'add', vendorId: '' });
  };

  const handleDeleteContract = (vendorId: string, contractId: string, title: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    if (!confirm(`Delete contract "${title}" and remove its costing?`)) return;

    const currentContracts = vendor.contracts || [];
    const updatedContracts = currentContracts.filter(c => c.id !== contractId);
    const newTotalCost = updatedContracts.reduce((sum, c) => sum + (c.cost || 0), 0);
    const newActiveCount = updatedContracts.filter(c => c.status === 'Active').length;

    onUpdateVendor(vendor.id, {
      contracts: updatedContracts,
      contractCost: newTotalCost,
      activeContractsCount: newActiveCount
    });

    onTriggerNotification('Contract Removed', `Deleted contract "${title}" from ${vendor.name}.`, 'info');
  };

  const toggleExpandContracts = (vendorId: string) => {
    setExpandedVendorContracts(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleRatingChange = (id: string, newRating: number) => {
    onUpdateVendor(id, { rating: newRating });
    const vendor = vendors.find(v => v.id === id);
    if (vendor) {
      onTriggerNotification(
        'Logistics Appraisal Updated',
        `Evaluated "${vendor.name}" performance at ${newRating} stars.`,
        'info'
      );
    }
  };

  const handleStatusChange = (id: string, newStatus: Vendor['status']) => {
    onUpdateVendor(id, { status: newStatus });
    const vendor = vendors.find(v => v.id === id);
    if (vendor) {
      onTriggerNotification(
        'Contract Status Changed',
        `Contract status for "${vendor.name}" is now ${newStatus}.`,
        'info'
      );
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.suppliedItems.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || v.type === filterType;
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getVendorIcon = (vendorType: string) => {
    const lower = (vendorType || '').toLowerCase();
    if (lower.includes('machin') || lower.includes('crane') || lower.includes('equip')) {
      return <Wrench className="w-4 h-4 text-fuchsia-400" />;
    }
    if (lower.includes('labour') || lower.includes('labor') || lower.includes('mason') || lower.includes('carpenter')) {
      return <HardHat className="w-4 h-4 text-emerald-400" />;
    }
    if (lower.includes('electric') || lower.includes('power') || lower.includes('wire')) {
      return <Zap className="w-4 h-4 text-amber-400" />;
    }
    if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('hvac')) {
      return <Wrench className="w-4 h-4 text-sky-400" />;
    }
    if (lower.includes('hauling') || lower.includes('transport') || lower.includes('logistic')) {
      return <Truck className="w-4 h-4 text-blue-400" />;
    }
    if (lower.includes('safety') || lower.includes('scaffold')) {
      return <ShieldCheck className="w-4 h-4 text-orange-400" />;
    }
    return <Truck className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Sub tabs switcher */}
      <div className="flex border-b border-zinc-800 gap-4 mb-2">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'directory'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Users className="w-4 h-4" /> Vendor Directory & Contracts ({vendors.length})
        </button>
        <button
          onClick={() => setActiveSubTab('tenders')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'tenders'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Gavel className="w-4 h-4" /> Bid Procurement & Tenders ({tenders.length})
        </button>
      </div>

      {activeSubTab === 'directory' ? (
        <>
          {/* Metrics Header */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Partners</span>
                <h3 className="text-2xl font-mono font-bold text-white mt-1">{totalVendors}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Supply chain ecosystem</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Suppliers</span>
                <h3 className="text-2xl font-mono font-bold text-emerald-400 mt-1">{activeCount}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">{totalContracts} total active contracts</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Contract Commitments</span>
                <h3 className="text-2xl font-mono font-bold text-white mt-1">${totalContractValue.toLocaleString()}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Total contract costing value</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-950/30 border border-cyan-900/50 flex items-center justify-center text-cyan-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#111114] p-5 rounded-lg border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Avg Quality Appraisal</span>
                <h3 className="text-2xl font-mono font-bold text-amber-400 mt-1">{averageRating} ★</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Performance rating score</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-950/30 border border-amber-900/50 flex items-center justify-center text-amber-400">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>

          {/* Control Panel / Search Bar */}
          <div className="bg-[#111114] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-[#141417] border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search vendor name, person, contract type, or items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Manage Supply & Contract Types Button */}
                <button
                  onClick={() => setShowTypeManagerModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  title="Configure and manage custom supply & contract types"
                >
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manage Contract Types ({supplyTypes.length})</span>
                </button>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard New Vendor</span>
                </button>
              </div>
            </div>

            {/* Dynamic Tab filters with all managed types */}
            <div className="px-4 py-2.5 bg-zinc-950/40 border-b border-zinc-800 flex flex-wrap items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1 shrink-0">Filter Category:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer shrink-0 ${
                  filterType === 'all' 
                    ? 'bg-zinc-800 text-white border border-zinc-700' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
                }`}
              >
                All Roles ({vendors.length})
              </button>
              {supplyTypes.map((t) => {
                const count = vendors.filter(v => v.type === t).length;
                return (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      filterType === t 
                        ? 'bg-zinc-800 text-white border border-zinc-700' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
                    }`}
                  >
                    <span>{t}</span>
                    {count > 0 && (
                      <span className="text-[10px] px-1 rounded bg-zinc-900 text-zinc-400 font-mono">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-zinc-700 font-mono hidden sm:inline">|</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs border border-zinc-800 p-1 rounded bg-zinc-900 text-zinc-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Contract Completed">Contract Completed</option>
                </select>
              </div>
            </div>

            {/* Onboarding Form */}
            {showAddForm && (
              <div className="p-5 border-b border-zinc-800 bg-zinc-900/40 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-zinc-400" /> Logistics Partner Registration & Master Agreement
                  </h4>
                  <button 
                    onClick={() => setShowAddForm(false)} 
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Logistics / Corporate Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Steel Foundries"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase">Contract / Supply Type *</label>
                      <button
                        type="button"
                        onClick={() => setShowTypeManagerModal(true)}
                        className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        + Manage Types
                      </button>
                    </div>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 focus:outline-none"
                    >
                      {supplyTypes.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                      <option value="__custom__">+ Enter Custom Type...</option>
                    </select>
                  </div>

                  {type === '__custom__' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1">Custom Supply Type Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Glazing & Curtain Walls"
                        value={customTypeInput}
                        onChange={(e) => setCustomTypeInput(e.target.value)}
                        className="w-full text-xs border border-cyan-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contact Officer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Marcus Carter"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                  )}

                  {type === '__custom__' && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contact Officer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Marcus Carter"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +1 (555) 234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contact Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. info@apexsteel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Initial Contract Cost ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 85000"
                      value={initialContractCost}
                      onChange={(e) => setInitialContractCost(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contract Scope / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Structural Framing Phase 1"
                      value={initialContractTitle}
                      onChange={(e) => setInitialContractTitle(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Appraisal Score (1-5)</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 focus:outline-none"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 - Premium Partner)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 - Highly Reliable)</option>
                      <option value={3}>⭐⭐⭐ (3 - Standard Supplier)</option>
                      <option value={2}>⭐⭐ (2 - Minor Incidents)</option>
                      <option value={1}>⭐ (1 - Needs Audit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Contract Completed">Contract Completed</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      Supplied Items / Services * <span className="text-[9px] text-zinc-500 normal-case">(comma separated list)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Structural Steel, I-Beams, Reinforced Rebars"
                      value={suppliedItemsRaw}
                      onChange={(e) => setSuppliedItemsRaw(e.target.value)}
                      className="w-full text-xs border border-zinc-800 p-2 rounded bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer font-mono tracking-wider uppercase"
                    >
                      Confirm Registration
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vendors Grid */}
            {filteredVendors.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-semibold">No registered vendors fit this criteria.</p>
                <p className="text-xs mt-1">Try broadening your search keywords or managing custom supply types.</p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((v) => {
                  const contractsList = v.contracts && v.contracts.length > 0 
                    ? v.contracts 
                    : (v.contractCost ? [{
                        id: `CTR-${v.id}-DEF`,
                        contractTitle: `${v.type} Primary Commitment`,
                        contractType: v.type,
                        cost: v.contractCost,
                        startDate: '2026-01-01',
                        billingFrequency: 'Monthly',
                        status: 'Active' as const,
                        notes: 'Base logistical supply contract'
                      }] : []);

                  const totalVendorCost = getVendorTotalCost(v);
                  const isExpanded = !!expandedVendorContracts[v.id];

                  return (
                    <div 
                      key={v.id} 
                      className="bg-zinc-900/50 border border-zinc-850 rounded-lg p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all relative group"
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                              {getVendorIcon(v.type)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-zinc-100 line-clamp-1">{v.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{v.id}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800 text-cyan-400 font-medium">
                                  {v.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick Edit & Delete Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditVendor(v)}
                              className="text-zinc-500 hover:text-cyan-400 p-1.5 rounded hover:bg-zinc-800 transition-all cursor-pointer"
                              title="Edit Vendor Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove vendor registration for "${v.name}" and cancel its associated costing?`)) {
                                  onRemoveVendor(v.id);
                                  onTriggerNotification('Vendor Removed', `Deregistered vendor "${v.name}" from active logistical databases.`, 'error');
                                }
                              }}
                              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/20 transition-all cursor-pointer"
                              title="Delete Vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Status Pill & Stars */}
                        <div className="flex items-center justify-between mt-3">
                          <select
                            value={v.status}
                            onChange={(e) => handleStatusChange(v.id, e.target.value as any)}
                            className={`text-[10px] font-mono uppercase tracking-wider font-semibold border rounded px-1.5 py-0.5 cursor-pointer bg-zinc-950 focus:outline-none ${
                              v.status === 'Active' ? 'text-emerald-400 border-emerald-950 bg-emerald-950/20' :
                              v.status === 'On Hold' ? 'text-amber-500 border-amber-950 bg-amber-950/20' :
                              'text-zinc-500 border-zinc-850 bg-zinc-900/40'
                            }`}
                          >
                            <option value="Active">Active</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Contract Completed">Contract Completed</option>
                          </select>

                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRatingChange(v.id, star)}
                                className="p-0.5 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                                title={`Rate ${star} Stars`}
                              >
                                <Star 
                                  className={`w-3.5 h-3.5 ${
                                    star <= v.rating ? 'fill-current text-amber-400' : 'text-zinc-700'
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Contract Costing Summary Banner */}
                      <div className="bg-[#141417] border border-zinc-800 rounded p-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block">Contract Costing Total</span>
                          <span className="text-sm font-bold font-mono text-emerald-400">
                            ${totalVendorCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAddContract(v)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Add new contract costing to this vendor"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                            <span>+ Costing</span>
                          </button>
                          <button
                            onClick={() => toggleExpandContracts(v.id)}
                            className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                            title="View / hide individual contracts"
                          >
                            <span>{contractsList.length}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Individual Contracts Section */}
                      {isExpanded && (
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded p-3 space-y-2.5 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-zinc-850 pb-1.5">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                              <FileText className="w-3 h-3 text-cyan-400" /> Contracts & Costings ({contractsList.length})
                            </span>
                            <button
                              onClick={() => handleOpenAddContract(v)}
                              className="text-[9px] text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" /> Add Contract
                            </button>
                          </div>

                          {contractsList.length === 0 ? (
                            <p className="text-[10px] text-zinc-500 italic py-1">No contracts currently recorded.</p>
                          ) : (
                            <div className="space-y-2">
                              {contractsList.map((ctr) => (
                                <div 
                                  key={ctr.id}
                                  className="bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 rounded p-2 text-xs space-y-1.5"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-0.5">
                                      <h5 className="font-bold text-white text-[11px] leading-tight">{ctr.contractTitle}</h5>
                                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
                                        <span className="px-1 py-0.2 rounded bg-zinc-950 text-cyan-300 font-mono">{ctr.contractType}</span>
                                        {ctr.billingFrequency && <span>• {ctr.billingFrequency}</span>}
                                        {ctr.status && (
                                          <span className={`px-1 py-0.2 rounded ${
                                            ctr.status === 'Active' ? 'bg-emerald-950 text-emerald-400' :
                                            ctr.status === 'Completed' ? 'bg-zinc-800 text-zinc-300' : 'bg-amber-950 text-amber-400'
                                          }`}>
                                            {ctr.status}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Cost amount and actions */}
                                    <div className="text-right shrink-0">
                                      <div className="font-mono font-bold text-emerald-400 text-xs">
                                        ${(ctr.cost || 0).toLocaleString()}
                                      </div>
                                      <div className="flex items-center justify-end gap-1 mt-1">
                                        <button
                                          onClick={() => handleOpenEditContract(v.id, ctr)}
                                          className="p-1 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded cursor-pointer"
                                          title="Edit Contract Costing"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteContract(v.id, ctr.id, ctr.contractTitle)}
                                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded cursor-pointer"
                                          title="Delete Contract"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {(ctr.startDate || ctr.endDate || ctr.notes) && (
                                    <div className="text-[9px] text-zinc-500 border-t border-zinc-850/60 pt-1 flex flex-wrap justify-between gap-1">
                                      {ctr.startDate && (
                                        <span>Dates: {ctr.startDate} {ctr.endDate ? `to ${ctr.endDate}` : ''}</span>
                                      )}
                                      {ctr.notes && (
                                        <span className="truncate max-w-[200px] text-zinc-400 italic">"{ctr.notes}"</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Supplied Items tagging */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1.5">Capabilities / Supplied Items</span>
                        <div className="flex flex-wrap gap-1">
                          {v.suppliedItems.map((item, idx) => (
                            <span 
                              key={idx} 
                              className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="border-t border-zinc-850 pt-3 flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span className="text-[10px] uppercase font-semibold text-zinc-500">Contact Officer:</span>
                          <span className="font-bold text-zinc-300">{v.contactPerson}</span>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-zinc-500 border-t border-zinc-850/50 pt-2.5">
                          <a href={`tel:${v.phone}`} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                            <Phone className="w-3 h-3 text-zinc-600" /> {v.phone}
                          </a>
                          <a href={`mailto:${v.email}`} className="flex items-center gap-1 hover:text-zinc-300 transition-colors truncate max-w-[150px]">
                            <Mail className="w-3 h-3 text-zinc-600" /> {v.email}
                          </a>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* TENDERS / BIDDING PROCUREMENT SUB-TAB */
        <div className="space-y-6 text-left">
          {/* Header summary card */}
          <div className="bg-[#111114] border border-zinc-800 p-5 rounded-lg flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Gavel className="w-4 h-4 text-amber-400" /> Procurement Tender Bidding Desk
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1">
                Publish material requests or subcontractor tenders, receive bids, and issue contracts instantly.
              </p>
            </div>
            <button
              onClick={() => setShowAddTenderForm(!showAddTenderForm)}
              className="px-3 py-1.5 bg-white text-zinc-950 font-bold text-xs rounded hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Launch Tender Request
            </button>
          </div>

          {/* Add Tender Form */}
          {showAddTenderForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTenderTitle || !newTenderBudget || !onAddTender) return;
                onAddTender({
                  id: `TND-${Math.floor(100 + Math.random() * 900)}`,
                  title: newTenderTitle,
                  projectName: newTenderProject || (projects[0]?.name) || 'All Projects',
                  description: newTenderDesc || 'No scope specified.',
                  category: newTenderCategory,
                  budget: Number(newTenderBudget),
                  dueDate: newTenderDueDate || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
                  status: 'Open',
                  bids: []
                });
                setNewTenderTitle('');
                setNewTenderDesc('');
                setNewTenderBudget('');
                setNewTenderDueDate('');
                setNewTenderProject('');
                setNewTenderCategory('Raw Materials');
                setShowAddTenderForm(false);
                onTriggerNotification('Tender Launched', `New tender Request "${newTenderTitle}" is live for bidding.`, 'success');
              }}
              className="bg-[#111114] border border-zinc-800 p-5 rounded-lg space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-zinc-400 font-semibold mb-1">Tender Title / Material Request Specification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supply of 500 Metric Tons Portland Cement (Grade 53)"
                    value={newTenderTitle}
                    onChange={(e) => setNewTenderTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Target Site Project *</label>
                  <select
                    required
                    value={newTenderProject}
                    onChange={(e) => setNewTenderProject(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="">Select Target Construction Site</option>
                    <option value="All Sites">All Sites / Universal Procurement</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Material Classification Category</label>
                  <select
                    value={newTenderCategory}
                    onChange={(e) => setNewTenderCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Structural">Structural Steel & Frame</option>
                    <option value="Finishing">Interior Finishing & Facades</option>
                    <option value="Plumbing">Plumbing Infrastructure</option>
                    <option value="Electrical">Grid & Electrical Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Target Ceiling Budget ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={newTenderBudget}
                    onChange={(e) => setNewTenderBudget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Bidding Submission Deadline</label>
                  <input
                    type="date"
                    value={newTenderDueDate}
                    onChange={(e) => setNewTenderDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-zinc-400 font-semibold mb-1">Detailed Requirements and Material Constraints</label>
                  <textarea
                    rows={3}
                    placeholder="Specify standards (e.g., ISO certifications, delivery timeframe, compliance bonds)..."
                    value={newTenderDesc}
                    onChange={(e) => setNewTenderDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowAddTenderForm(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-white text-zinc-950 font-bold rounded hover:bg-zinc-200 cursor-pointer"
                >
                  Publish Tender
                </button>
              </div>
            </form>
          )}

          {/* Tenders Registry */}
          <div className="grid grid-cols-1 gap-6">
            {tenders.length === 0 ? (
              <div className="p-12 border border-zinc-800 bg-[#111114] rounded-lg text-center space-y-2">
                <Gavel className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-400 text-sm">No procurement tenders are currently active in the marketplace.</p>
              </div>
            ) : (
              tenders.map((tender) => (
                <div
                  key={tender.id}
                  className="bg-[#111114] border border-zinc-800 rounded-lg p-5 space-y-5"
                >
                  {/* Tender Header info */}
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-semibold">
                          {tender.id}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider ${
                          tender.status === 'Open'
                            ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400 animate-pulse'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          Tender {tender.status}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mt-1.5">{tender.title}</h5>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{tender.description}</p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Ceiling Budget Allocation</span>
                      <span className="text-base font-bold text-white">${tender.budget.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-400 block mt-1">Deadline: {tender.dueDate}</span>
                    </div>
                  </div>

                  {/* Submit Bid Drawer Toggle Button */}
                  {tender.status === 'Open' && (
                    <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Do you represent a partner vendor? Place an official quotation bid.</span>
                      <button
                        onClick={() => setShowAddBidId(showAddBidId === tender.id ? null : tender.id)}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold rounded cursor-pointer"
                      >
                        {showAddBidId === tender.id ? 'Cancel Quote' : 'Place Tender Bid'}
                      </button>
                    </div>
                  )}

                  {/* Bid Quote Placement Form */}
                  {showAddBidId === tender.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newBidVendorName || !newBidAmount || !onAddBid) return;
                        const matchedVendor = vendors.find(v => v.name === newBidVendorName);
                        onAddBid(tender.id, {
                          id: `BID-${Math.floor(1000 + Math.random() * 9000)}`,
                          vendorId: matchedVendor?.id || 'VND-000',
                          vendorName: newBidVendorName,
                          amount: Number(newBidAmount),
                          deliveryDays: Number(newBidDeliveryDays || 15),
                          proposal: newBidProposal || 'Detailed supply list submitted.',
                          status: 'Pending',
                          submittedAt: new Date().toISOString().split('T')[0]
                        });
                        setNewBidVendorName('');
                        setNewBidAmount('');
                        setNewBidDeliveryDays('');
                        setNewBidProposal('');
                        setShowAddBidId(null);
                        onTriggerNotification('Quotation Submitted', 'Your procurement bid was received successfully.', 'success');
                      }}
                      className="bg-zinc-950/60 p-4 border border-zinc-850 rounded space-y-3.5 text-xs text-left"
                    >
                      <h6 className="text-[10px] font-bold text-white uppercase tracking-wider">Place Official Tender Bid Quotation</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">Quotated Vendor Name *</label>
                          <select
                            value={newBidVendorName}
                            onChange={(e) => setNewBidVendorName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200"
                            required
                          >
                            <option value="">Select Partner Vendor</option>
                            {vendors.map(v => (
                              <option key={v.id} value={v.name}>{v.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">Contract Sum Quotation ($) *</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 42000"
                            value={newBidAmount}
                            onChange={(e) => setNewBidAmount(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 font-semibold mb-1">Execution Duration (Days)</label>
                          <input
                            type="number"
                            placeholder="e.g. 30"
                            value={newBidDeliveryDays}
                            onChange={(e) => setNewBidDeliveryDays(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Capabilities Proposal & Quality Statements</label>
                        <textarea
                          rows={2}
                          placeholder="Detail materials, transit schedules, warranties..."
                          value={newBidProposal}
                          onChange={(e) => setNewBidProposal(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddBidId(null)}
                          className="px-2.5 py-1 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-white text-zinc-950 font-bold rounded"
                        >
                          Submit Quotation
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Submitted Bids evaluation space */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Submitted Quotas & Appraisals ({tender.bids?.length || 0})</span>
                    {(!tender.bids || tender.bids.length === 0) ? (
                      <p className="text-[11px] text-zinc-500 italic pl-1">No bids received yet for this active tender.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {tender.bids.map((bid) => (
                          <div
                            key={bid.id}
                            className={`p-3.5 border rounded text-xs flex flex-wrap justify-between items-center gap-3 ${
                              bid.status === 'Accepted'
                                ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300'
                                : bid.status === 'Rejected'
                                ? 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500'
                                : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{bid.vendorName}</span>
                                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                                  bid.status === 'Accepted'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : bid.status === 'Rejected'
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {bid.status} Quote
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 italic">"{bid.proposal}"</p>
                              <p className="text-[10px] text-zinc-500 font-mono">Quoted Timeline: {bid.deliveryDays} Days • ID: {bid.id}</p>
                            </div>

                            <div className="text-right flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[10px] font-mono text-zinc-500 block">Quoted Price Sum</span>
                                <span className="font-bold text-white text-sm font-mono">${bid.amount.toLocaleString()}</span>
                              </div>

                              {tender.status === 'Open' && bid.status === 'Pending' && onUpdateTender && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      onUpdateTender(tender.id, {
                                        status: 'Closed',
                                        bids: tender.bids.map(b =>
                                          b.id === bid.id
                                            ? { ...b, status: 'Accepted' }
                                            : { ...b, status: 'Rejected' }
                                        )
                                      });
                                      onTriggerNotification('Tender Awarded', `Contract awarded to ${bid.vendorName} for $${bid.amount.toLocaleString()}.`, 'success');
                                    }}
                                    className="px-2 py-1.5 bg-emerald-500 text-zinc-950 font-bold text-[10px] rounded hover:bg-emerald-400 cursor-pointer"
                                  >
                                    Award Contract
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONTRACT / SUPPLY TYPES MANAGER (Owner Create / Edit / Delete)  */}
      {/* ========================================================================= */}
      {showTypeManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl w-full max-w-lg p-5 space-y-5 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-950/40 border border-cyan-900/50 rounded text-cyan-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Manage Contract & Supply Types</h3>
                  <p className="text-[10px] text-zinc-400">Create, rename, or delete logistical categories freely.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTypeManagerModal(false);
                  setEditingTypeOriginal(null);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create Type Form */}
            <form onSubmit={handleAddSupplyType} className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Create New Contract / Supply Type
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Scaffolding & Rigging, HVAC Maintenance, Glazing..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Type</span>
                </button>
              </div>
            </form>

            {/* Existing Types List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Existing Types ({supplyTypes.length})
              </span>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {supplyTypes.map((t) => {
                  const isEditingThis = editingTypeOriginal === t;
                  const usageCount = vendors.filter(v => v.type === t).length;

                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-850 rounded hover:border-zinc-800 transition-colors"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingTypeName}
                            onChange={(e) => setEditingTypeName(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-cyan-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditType}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTypeOriginal(null)}
                            className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-200">{t}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono">
                            {usageCount} {usageCount === 1 ? 'vendor' : 'vendors'}
                          </span>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditType(t)}
                            className="p-1 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-850 rounded cursor-pointer"
                            title="Edit Type Name"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplyType(t)}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded cursor-pointer"
                            title="Delete Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-850">
              <button
                type="button"
                onClick={() => {
                  setShowTypeManagerModal(false);
                  setEditingTypeOriginal(null);
                }}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONTRACT COSTING ADD / EDIT MODAL                                */}
      {/* ========================================================================= */}
      {contractModalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-950/40 border border-emerald-900/50 rounded text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {contractModalState.mode === 'add' ? 'Add Contract Costing' : 'Edit Contract Costing'}
                  </h3>
                  <p className="text-[10px] text-zinc-400">Configure contract pricing, scope, billing terms, and dates.</p>
                </div>
              </div>
              <button
                onClick={() => setContractModalState({ isOpen: false, mode: 'add', vendorId: '' })}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContractCosting} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contract Title / Milestone Scope *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower Foundation Bulk Cement Supply"
                  value={contractFormTitle}
                  onChange={(e) => setContractFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contract / Supply Type *</label>
                  <select
                    value={contractFormType}
                    onChange={(e) => setContractFormType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  >
                    {supplyTypes.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Costing Amount ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 95000"
                    value={contractFormCost}
                    onChange={(e) => setContractFormCost(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Billing Frequency</label>
                  <select
                    value={contractFormBilling}
                    onChange={(e) => setContractFormBilling(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  >
                    <option value="Milestone">Milestone Based</option>
                    <option value="Monthly">Monthly Cycle</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Weekly">Weekly Payroll / Quota</option>
                    <option value="Lump Sum">Lump Sum on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contract Status</label>
                  <select
                    value={contractFormStatus}
                    onChange={(e) => setContractFormStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Commencement Date</label>
                  <input
                    type="date"
                    value={contractFormStartDate}
                    onChange={(e) => setContractFormStartDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">End / Delivery Date</label>
                  <input
                    type="date"
                    value={contractFormEndDate}
                    onChange={(e) => setContractFormEndDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Scope Details & Quality Commitments</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Guaranteed supply of 45 tons Grade 53 OPC cement with 48h SLA..."
                  value={contractFormNotes}
                  onChange={(e) => setContractFormNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setContractModalState({ isOpen: false, mode: 'add', vendorId: '' })}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded cursor-pointer"
                >
                  {contractModalState.mode === 'add' ? 'Confirm Contract Costing' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT VENDOR MODAL                                                */}
      {/* ========================================================================= */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-950/40 border border-cyan-900/50 rounded text-cyan-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Edit Partner Details</h3>
                  <p className="text-[10px] text-zinc-400">Update supplier corporate details, supply types, and contact officers.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVendor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company / Logistics Name *</label>
                  <input
                    type="text"
                    required
                    value={editVendorName}
                    onChange={(e) => setEditVendorName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contract / Supply Type *</label>
                  <select
                    value={editVendorType}
                    onChange={(e) => setEditVendorType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  >
                    {supplyTypes.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                    <option value="__custom__">+ Custom Supply Type...</option>
                  </select>
                </div>

                {editVendorType === '__custom__' && (
                  <div>
                    <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1">Custom Supply Type Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Scaffolding"
                      value={editVendorCustomType}
                      onChange={(e) => setEditVendorCustomType(e.target.value)}
                      className="w-full bg-zinc-950 border border-cyan-800 rounded p-2 text-zinc-200 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Contact Officer Name *</label>
                  <input
                    type="text"
                    required
                    value={editVendorContact}
                    onChange={(e) => setEditVendorContact(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editVendorPhone}
                    onChange={(e) => setEditVendorPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editVendorEmail}
                    onChange={(e) => setEditVendorEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Status</label>
                  <select
                    value={editVendorStatus}
                    onChange={(e) => setEditVendorStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Contract Completed">Contract Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Appraisal Rating</label>
                  <select
                    value={editVendorRating}
                    onChange={(e) => setEditVendorRating(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  >
                    <option value={5}>5 Stars (Premium Partner)</option>
                    <option value={4}>4 Stars (Highly Reliable)</option>
                    <option value={3}>3 Stars (Standard Supplier)</option>
                    <option value={2}>2 Stars (Needs Improvement)</option>
                    <option value={1}>1 Star (Under Audit)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Supplied Items / Services <span className="text-[9px] text-zinc-500 normal-case">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editVendorSuppliedItems}
                    onChange={(e) => setEditVendorSuppliedItems(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded cursor-pointer"
                >
                  Save Partner Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
