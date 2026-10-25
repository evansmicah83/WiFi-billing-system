import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Server,
  CheckCircle2,
  Trash2,
  X,
  Search,
  Filter,
  Download,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Cpu,
  Layers,
  Radio,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { InventoryItem } from '../../types';

export const InventoryView: React.FC = () => {
  const { inventory, addInventoryItem, deleteInventoryItem, sites, customers, updateCustomer, settings } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<InventoryItem['category']>('wireless_cpe');
  const [modelName, setModelName] = useState('Ubiquiti LiteBeam 5AC Gen2');
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [purchaseCostKes, setPurchaseCostKes] = useState(65);
  const [siteId, setSiteId] = useState(sites[0]?.id || 'site_default');
  const [status, setStatus] = useState<'in_stock' | 'deployed' | 'faulty' | 'reserved'>('in_stock');
  const [notes, setNotes] = useState('');

  // Assign modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.macAddress && item.macAddress.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, selectedCategory, selectedStatus]);

  // Derived Dynamic Metrics
  const totalAssets = inventory.length;
  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const deployedCount = inventory.filter((i) => i.status === 'deployed').length;
  const faultyCount = inventory.filter((i) => i.status === 'faulty').length;
  const totalValueKes = inventory.reduce((sum, i) => sum + (i.purchaseCostKes || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || !serialNumber.trim()) return;

    addInventoryItem({
      tenantId: 'tenant_ke_001',
      siteId: siteId || sites[0]?.id || 'site_default',
      category,
      modelName: modelName.trim(),
      serialNumber: serialNumber.trim().toUpperCase(),
      macAddress: macAddress.trim().toUpperCase() || undefined,
      status,
      purchaseCostKes: Number(purchaseCostKes) || 0,
      notes: notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    showToast(`Registered ${modelName.trim()} (S/N: ${serialNumber.trim().toUpperCase()})`);
    resetForm();
  };

  const resetForm = () => {
    setModelName('Huawei HG8546M XPON ONT');
    setSerialNumber('');
    setMacAddress('');
    setPurchaseCostKes(2400);
    setNotes('');
    setStatus('in_stock');
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteInventoryItem(itemToDelete.id);
    setItemToDelete(null);
    showToast(`Removed hardware asset.`);
  };

  const handleAssignToCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningItem) return;

    if (selectedCustomerId) {
      // Find customer and update
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        updateCustomer(cust.id, { onuSerialNumber: assigningItem.serialNumber });
      }
      // Update inventory item status to deployed
      assigningItem.status = 'deployed';
      assigningItem.assignedToCustomerId = selectedCustomerId;
      showToast(`Asset assigned to subscriber ${cust?.fullName || selectedCustomerId}`);
    } else {
      // Return to stock
      assigningItem.status = 'in_stock';
      assigningItem.assignedToCustomerId = undefined;
      showToast(`Asset returned to stock.`);
    }

    setAssigningItem(null);
    setSelectedCustomerId('');
  };

  const handleExportCsv = () => {
    if (inventory.length === 0) return;
    const headers = ['Category', 'Model Name', 'Serial Number', 'MAC Address', 'Status', 'Site', 'Cost KES'];
    const rows = inventory.map((i) => [
      i.category,
      `"${i.modelName}"`,
      i.serialNumber,
      i.macAddress || '',
      i.status,
      i.siteId,
      i.purchaseCostKes,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartLinkNet_Hardware_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preset quick addition
  const handleAddPreset = (cat: any, model: string, cost: number, snPrefix: string) => {
    const randomSn = `${snPrefix}${Math.floor(100000 + Math.random() * 900000)}`;
    addInventoryItem({
      tenantId: 'tenant_ke_001',
      siteId: sites[0]?.id || 'site_default',
      category: cat,
      modelName: model,
      serialNumber: randomSn,
      status: 'in_stock',
      purchaseCostKes: cost,
    });
    showToast(`Added stock item: ${model} (${randomSn})`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Network Hardware, Wireless & CPE Inventory
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Track Wireless Radios (Ubiquiti/MikroTik/Cambium), GPON/EPON ONUs, Hotspot APs, Core Switches, Splitters, and Distribution equipment.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={inventory.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC] disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Hardware Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Total Hardware Units</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#1976D2]">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalAssets}</span>
            <span className="text-xs text-[#64748B]">items</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {settings.currency} {totalValueKes.toLocaleString()} asset value
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">In Stock (Ready)</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{inStockCount}</span>
            <span className="text-xs text-[#64748B]">available</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Available for field dispatch</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Deployed to Subscribers</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{deployedCount}</span>
            <span className="text-xs text-[#64748B]">in service</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {totalAssets > 0 ? `${Math.round((deployedCount / totalAssets) * 100)}% utilization` : '0%'}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Faulty / Repair</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-600">{faultyCount}</span>
            <span className="text-xs text-[#64748B]">quarantined</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Requires optical bench test</div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search serial number, MAC, model name..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-xs text-[#172B4D] placeholder-[#64748B] focus:border-[#1976D2] focus:outline-hidden"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-[#64748B]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#64748B] mr-1 hidden sm:inline">Status:</span>
            {(['all', 'in_stock', 'deployed', 'faulty'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors uppercase ${
                  selectedStatus === st
                    ? 'bg-[#123B5D] text-white'
                    : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Equipment' },
            { id: 'wireless_cpe', label: 'Wireless CPE Radios' },
            { id: 'wireless_ap', label: 'Wireless Hotspot APs' },
            { id: 'switch', label: 'Managed Switches' },
            { id: 'ont_onu', label: 'ONT / ONU Modems' },
            { id: 'olt', label: 'OLT Chassis' },
            { id: 'fat_box', label: 'FAT Boxes' },
            { id: 'splitter', label: 'PLC Splitters' },
            { id: 'mikrotik_router', label: 'MikroTik Routers' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1 font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#1976D2] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {inventory.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1976D2]">
            <Boxes className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No hardware assets registered</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mt-1">
              Log serial numbers and MAC addresses for Wireless CPEs, ONTs/ONUs, distribution switches, and Access Points deployed across your ISP network.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Asset</span>
            </button>
          </div>

          {/* Quick Setup Presets */}
          <div className="pt-4 border-t border-[#E2E8F0] max-w-2xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Quick-add standard broadband & wireless hardware to stock:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleAddPreset('wireless_cpe', 'Ubiquiti LiteBeam 5AC Gen2', 65, 'UB-LBE5-')}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Ubiquiti LiteBeam 5AC</div>
                <div className="text-[10px] text-[#64748B]">Wireless CPE • {settings.currency} 65</div>
              </button>
              <button
                onClick={() => handleAddPreset('wireless_cpe', 'MikroTik LHG 5 High-Gain', 58, 'MTK-LHG5-')}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">MikroTik LHG 5</div>
                <div className="text-[10px] text-[#64748B]">Wireless CPE • {settings.currency} 58</div>
              </button>
              <button
                onClick={() => handleAddPreset('ont_onu', 'Huawei HG8546M XPON ONT', 22, 'HWTC-')}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Huawei HG8546M</div>
                <div className="text-[10px] text-[#64748B]">XPON ONT • {settings.currency} 22</div>
              </button>
            </div>
          </div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <p className="text-xs text-[#64748B]">No equipment items match the current search filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="mt-2 text-xs font-semibold text-[#1976D2] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Equipment / Model</th>
                  <th className="px-4 py-3 text-left font-semibold">Serial Number & MAC</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Cost ({settings.currency})</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredInventory.map((item) => {
                  const assignedCustomer = customers.find((c) => c.id === item.assignedToCustomerId || c.onuSerialNumber === item.serialNumber);

                  return (
                    <tr key={item.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#123B5D]">{item.modelName}</div>
                        {item.notes && <div className="text-[10px] text-[#64748B] truncate max-w-xs">{item.notes}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-[#1976D2]">{item.serialNumber}</div>
                        {item.macAddress && <div className="font-mono text-[10px] text-[#64748B]">{item.macAddress}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-[#64748B]">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.status === 'deployed'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'in_stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'faulty'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {assignedCustomer ? (
                          <div className="text-xs">
                            <span className="font-semibold text-[#123B5D]">{assignedCustomer.fullName}</span>
                            <span className="block text-[10px] text-[#64748B] font-mono">{assignedCustomer.accountNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#64748B] italic">Unassigned (In Warehouse)</span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold text-[#172B4D]">
                        {settings.currency} {item.purchaseCostKes.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setAssigningItem(item);
                              setSelectedCustomerId(item.assignedToCustomerId || '');
                            }}
                            className="rounded bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#1976D2] hover:bg-blue-100"
                            title="Assign to Subscriber"
                          >
                            {item.status === 'deployed' ? 'Reassign' : 'Deploy'}
                          </button>

                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Remove Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredInventory.map((item) => {
              const assignedCustomer = customers.find((c) => c.id === item.assignedToCustomerId || c.onuSerialNumber === item.serialNumber);

              return (
                <div key={item.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded">
                        {item.serialNumber}
                      </span>
                      <h4 className="text-sm font-bold text-[#123B5D] mt-1.5">{item.modelName}</h4>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                        item.status === 'deployed'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'in_stock'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs rounded-lg bg-[#F5F8FC] p-2.5">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Category</span>
                      <span className="font-semibold text-[#172B4D] uppercase text-[11px]">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Purchase Cost</span>
                      <span className="font-bold text-[#123B5D]">KES {item.purchaseCostKes.toLocaleString()}</span>
                    </div>
                  </div>

                  {assignedCustomer && (
                    <div className="text-xs text-[#123B5D] bg-emerald-50/60 border border-emerald-100 p-2 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Assigned Subscriber</span>
                        <span className="font-bold">{assignedCustomer.fullName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700">{assignedCustomer.accountNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => {
                        setAssigningItem(item);
                        setSelectedCustomerId(item.assignedToCustomerId || '');
                      }}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1976D2] hover:bg-blue-100"
                    >
                      {item.status === 'deployed' ? 'Reassign / Return' : 'Deploy to Subscriber'}
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 text-[#64748B] hover:text-rose-600 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Add Hardware Asset */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-[#1976D2]" />
                <h3 className="text-base font-bold text-[#123B5D]">Register Hardware Asset</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#172B4D] p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Asset Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="wireless_cpe">Wireless CPE Radio (AirMAX / MikroTik / Cambium)</option>
                    <option value="wireless_ap">Wireless Hotspot Access Point (Dual-Band / Wi-Fi 6)</option>
                    <option value="switch">Managed Network Switch (PoE / Core / Distribution)</option>
                    <option value="ont_onu">ONT / ONU (Customer Optical Modem)</option>
                    <option value="olt">OLT (Optical Line Terminal)</option>
                    <option value="splitter">PLC Optical Splitter (1:8, 1:16)</option>
                    <option value="fat_box">FAT Box (Fibre Access Terminal)</option>
                    <option value="mikrotik_router">MikroTik Router Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Stock Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="in_stock">In Stock (Warehouse)</option>
                    <option value="deployed">Deployed in Field</option>
                    <option value="faulty">Faulty / Needs Repair</option>
                    <option value="reserved">Reserved for Staging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Model Name *</label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. Ubiquiti LiteBeam 5AC or Huawei HG8546M"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Serial Number (S/N) *</label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. UB-LBE5AC-9941"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono uppercase focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">MAC Address (Optional)</label>
                  <input
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                    placeholder="e.g. 48:D2:4F:1A:2B:3C"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono uppercase focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Unit Cost ({settings.currency})</label>
                  <input
                    type="number"
                    value={purchaseCostKes}
                    onChange={(e) => setPurchaseCostKes(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Storage / PoP Hub</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    {sites.length === 0 && <option value="site_default">Main Warehouse</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Technician Notes / Optical Signal</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Firmware v5.2, Dual band 2.4/5GHz, calibrated for -19dBm"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] transition-colors"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign / Deploy Asset */}
      {assigningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#123B5D]">Deploy Equipment</h3>
              <button onClick={() => setAssigningItem(null)} className="text-[#64748B] hover:text-[#172B4D] p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-[#F5F8FC] p-3 text-xs space-y-1">
              <div className="font-bold text-[#123B5D]">{assigningItem.modelName}</div>
              <div className="font-mono text-[#1976D2]">S/N: {assigningItem.serialNumber}</div>
            </div>

            <form onSubmit={handleAssignToCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Assign to Customer Account</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="">-- None (Return to In-Stock Warehouse) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber}) - {c.physicalAddress}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Selecting a customer will update their ONU Serial Number record and flag this asset as "Deployed".
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setAssigningItem(null)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D]"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Modal: Confirm Delete Asset */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#123B5D]">Remove Hardware Asset?</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#123B5D]">{itemToDelete.modelName}</span> (S/N: {itemToDelete.serialNumber})?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setItemToDelete(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
