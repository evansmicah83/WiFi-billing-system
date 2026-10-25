import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  DollarSign,
  Ticket,
  Phone,
  Trash2,
  X,
  Search,
  Wallet,
  Building,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Coins,
  Send,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { ResellerAccount } from '../../types';

export const ResellersView: React.FC = () => {
  const { resellers, addReseller, updateReseller, sites, vouchers, packages, generateVouchersBatch, settings } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [managingReseller, setManagingReseller] = useState<ResellerAccount | null>(null);
  const [resellerToDelete, setResellerToDelete] = useState<ResellerAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('2547');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState(15);
  const [assignedSiteId, setAssignedSiteId] = useState(sites[0]?.id || '');

  // Wallet Management Form State
  const [walletAction, setWalletAction] = useState<'topup' | 'commission_payout' | 'allocate_vouchers'>('topup');
  const [topupAmount, setTopupAmount] = useState(2000);
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  const [voucherCount, setVoucherCount] = useState(25);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Resellers
  const filteredResellers = useMemo(() => {
    return resellers.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [resellers, searchTerm, selectedStatus]);

  // Derived Dynamic Metrics
  const totalResellers = resellers.length;
  const activeResellers = resellers.filter((r) => r.status === 'active').length;
  const totalWalletFloat = resellers.reduce((sum, r) => sum + (r.walletBalanceKes || 0), 0);
  const totalVouchersSoldByAgents = resellers.reduce((sum, r) => sum + (r.totalVouchersSold || 0), 0);
  const totalAgentSalesKes = resellers.reduce((sum, r) => sum + (r.totalSalesKes || 0), 0);
  const estimatedCommissionsKes = resellers.reduce(
    (sum, r) => sum + (r.totalSalesKes * (r.commissionPercentage / 100)),
    0
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessName.trim() || !phone.trim()) return;

    addReseller({
      tenantId: 'tenant_ke_001',
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      businessName: businessName.trim(),
      assignedSiteId: assignedSiteId || sites[0]?.id || 'site_default',
      commissionPercentage: Number(commissionPercentage) || 10,
      status: 'active',
    });

    setIsAddModalOpen(false);
    showToast(`Registered agent "${businessName.trim()}"`);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('2547');
    setEmail('');
    setBusinessName('');
    setCommissionPercentage(15);
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingReseller) return;

    if (walletAction === 'topup') {
      const newBal = (managingReseller.walletBalanceKes || 0) + Number(topupAmount);
      updateReseller(managingReseller.id, { walletBalanceKes: newBal });
      showToast(`Credited KES ${topupAmount.toLocaleString()} to ${managingReseller.businessName} wallet`);
    } else if (walletAction === 'commission_payout') {
      const payout = Number(topupAmount);
      const newBal = Math.max(0, (managingReseller.walletBalanceKes || 0) - payout);
      updateReseller(managingReseller.id, { walletBalanceKes: newBal });
      showToast(`M-Pesa B2C Commission Payout of KES ${payout.toLocaleString()} sent to ${managingReseller.phone}`);
    } else if (walletAction === 'allocate_vouchers') {
      if (selectedPackageId) {
        const batch = generateVouchersBatch(
          selectedPackageId,
          Number(voucherCount),
          managingReseller.businessName.slice(0, 3).toUpperCase(),
          managingReseller.assignedSiteId
        );
        // Link vouchers to reseller
        batch.forEach((v) => {
          v.resellerId = managingReseller.id;
        });
        showToast(`Generated & allocated ${voucherCount} vouchers to ${managingReseller.businessName}`);
      }
    }

    setManagingReseller(null);
  };

  const toggleResellerStatus = (r: ResellerAccount) => {
    const nextStatus = r.status === 'active' ? 'suspended' : 'active';
    updateReseller(r.id, { status: nextStatus });
    showToast(`Agent account ${nextStatus.toUpperCase()}`);
  };

  // Quick preset helper
  const handleAddPreset = (bName: string, pName: string, phoneNo: string, rate: number) => {
    addReseller({
      tenantId: 'tenant_ke_001',
      name: pName,
      phone: phoneNo,
      businessName: bName,
      assignedSiteId: sites[0]?.id || 'site_default',
      commissionPercentage: rate,
      status: 'active',
    });
    showToast(`Registered preset agent: ${bName}`);
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
            Resellers & Agent Commissions
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Empower retail partners, cybercafes, kiosks, and caretakers to sell Hotspot vouchers with float wallets and automated commissions.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Register Reseller</span>
        </button>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Active Retail Agents</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#1976D2]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalResellers}</span>
            <span className="text-xs text-[#64748B]">agents</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            {activeResellers} active selling
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Agent Wallet Float</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              {settings.currency} {totalWalletFloat.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Pre-funded credit in circulation</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Vouchers Sold</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalVouchersSoldByAgents}</span>
            <span className="text-xs text-[#64748B]">cards</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {settings.currency} {totalAgentSalesKes.toLocaleString()} sales total
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Commissions Earned</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">
              {settings.currency} {Math.round(estimatedCommissionsKes).toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">10% - 20% average margin</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business name, agent name, phone..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-xs text-[#172B4D] placeholder-[#64748B] focus:border-[#1976D2] focus:outline-hidden"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-[#64748B]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[
            { id: 'all', label: `All (${totalResellers})` },
            { id: 'active', label: `Active (${activeResellers})` },
            { id: 'suspended', label: `Suspended (${totalResellers - activeResellers})` },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
                selectedStatus === st.id
                  ? 'bg-[#123B5D] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid or Zero State */}
      {resellers.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1976D2]">
            <UserCheck className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No retail resellers registered</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mt-1">
              Add your retail partners (local cybercafes, apartment caretakers, chemist shops) to distribute physical or digital Hotspot Wi-Fi vouchers.
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
              <span>Register First Reseller</span>
            </button>
          </div>

          {/* Quick presets */}
          <div className="pt-4 border-t border-[#E2E8F0] max-w-xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Or quick-onboard common Kenyan agent profiles:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleAddPreset('Mwangi Cyber & Chemist', 'David Mwangi', '254712345678', 15)}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Mwangi Cyber</div>
                <div className="text-[10px] text-[#64748B]">15% Commission Rate</div>
              </button>
              <button
                onClick={() => handleAddPreset('Amani Heights Caretaker', 'Samson Kiprop', '254722987654', 10)}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Estate Caretaker</div>
                <div className="text-[10px] text-[#64748B]">10% Commission Rate</div>
              </button>
              <button
                onClick={() => handleAddPreset('Nyali Beach Kiosk', 'Amina Hassan', '254733123456', 20)}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Beach Kiosk Node</div>
                <div className="text-[10px] text-[#64748B]">20% Commission Rate</div>
              </button>
            </div>
          </div>
        </div>
      ) : filteredResellers.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <p className="text-xs text-[#64748B]">No resellers match "{searchTerm}".</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
            }}
            className="mt-2 text-xs font-semibold text-[#1976D2] hover:underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResellers.map((r) => {
            const assignedSite = sites.find((s) => s.id === r.assignedSiteId);

            return (
              <div
                key={r.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-[#1976D2] transition-colors space-y-3"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#123B5D] truncate max-w-[180px]">{r.businessName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        r.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#172B4D]">{r.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                      <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                      <a href={`tel:${r.phone}`} className="font-mono text-[#1976D2] hover:underline">
                        {r.phone}
                      </a>
                    </div>
                    {assignedSite && (
                      <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-1">
                        <Building className="h-3 w-3 text-[#1976D2] shrink-0" />
                        <span>PoP: {assignedSite.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F5F8FC] p-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">Float Balance</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {settings.currency} {(r.walletBalanceKes || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">Commission Rate</span>
                      <span className="font-bold text-[#123B5D] text-sm flex items-center gap-0.5">
                        <Percent className="h-3 w-3 text-emerald-600" />
                        {r.commissionPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Vouchers & Sales Summary */}
                  <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
                    <span>Sold: <strong className="text-[#123B5D]">{r.totalVouchersSold || 0} vouchers</strong></span>
                    <span>Sales: <strong className="text-emerald-700">{settings.currency} {(r.totalSalesKes || 0).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <button
                    onClick={() => setManagingReseller(r)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1976D2] hover:bg-blue-100 transition-colors"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Manage Float</span>
                  </button>

                  <button
                    onClick={() => toggleResellerStatus(r)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      r.status === 'active'
                        ? 'text-[#64748B] hover:text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {r.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register Reseller */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#1976D2]" />
                <h3 className="text-base font-bold text-[#123B5D]">Register Reseller / Agent</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#172B4D] p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Business / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Mwangi Cyber & Chemist"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Mwangi"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">M-Pesa Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@example.com"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Assigned PoP Site</label>
                  <select
                    value={assignedSiteId}
                    onChange={(e) => setAssignedSiteId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    {sites.length === 0 && <option value="site_default">Default Network PoP</option>}
                  </select>
                </div>
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
                  Register Reseller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Float & Disburse Commission */}
      {managingReseller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">Manage Float & Vouchers</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {managingReseller.businessName} • {managingReseller.phone}
                </p>
              </div>
              <button onClick={() => setManagingReseller(null)} className="text-[#64748B] hover:text-[#172B4D] p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Balance Card */}
            <div className="rounded-lg bg-[#F5F8FC] p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748B] block uppercase font-medium">Current Float Balance</span>
                <span className="text-base font-bold text-emerald-700">
                  {settings.currency} {(managingReseller.walletBalanceKes || 0).toLocaleString()}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#123B5D] bg-white border border-[#E2E8F0] px-2 py-1 rounded">
                {managingReseller.commissionPercentage}% Commission
              </span>
            </div>

            {/* Tabs for action */}
            <div className="flex border-b border-[#E2E8F0] text-xs">
              <button
                type="button"
                onClick={() => setWalletAction('topup')}
                className={`flex-1 py-2 font-bold border-b-2 text-center ${
                  walletAction === 'topup' ? 'border-[#1976D2] text-[#1976D2]' : 'border-transparent text-[#64748B]'
                }`}
              >
                Top Up Float
              </button>
              <button
                type="button"
                onClick={() => setWalletAction('commission_payout')}
                className={`flex-1 py-2 font-bold border-b-2 text-center ${
                  walletAction === 'commission_payout'
                    ? 'border-[#1976D2] text-[#1976D2]'
                    : 'border-transparent text-[#64748B]'
                }`}
              >
                Disburse Commission
              </button>
              <button
                type="button"
                onClick={() => setWalletAction('allocate_vouchers')}
                className={`flex-1 py-2 font-bold border-b-2 text-center ${
                  walletAction === 'allocate_vouchers'
                    ? 'border-[#1976D2] text-[#1976D2]'
                    : 'border-transparent text-[#64748B]'
                }`}
              >
                Allocate Vouchers
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="space-y-4 text-xs">
              {walletAction === 'topup' && (
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Float Amount to Credit ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold focus:border-[#1976D2] focus:outline-hidden"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Adds credit balance to the agent's account after they make cash deposit or Paybill payment.
                  </p>
                </div>
              )}

              {walletAction === 'commission_payout' && (
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Commission Payout Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold focus:border-[#1976D2] focus:outline-hidden"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Initiates an M-Pesa B2C commission transfer to {managingReseller.phone}.
                  </p>
                </div>
              )}

              {walletAction === 'allocate_vouchers' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Select Hotspot Plan</label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                    >
                      {packages
                        .filter((p) => p.serviceType === 'hotspot')
                        .map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} - {settings.currency} {pkg.priceKes} ({pkg.downloadSpeedMbps}Mbps)
                          </option>
                        ))}
                      {packages.filter((p) => p.serviceType === 'hotspot').length === 0 && (
                        <option value="">No Hotspot packages found (create one in Packages)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Number of Vouchers to Issue</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={voucherCount}
                      onChange={(e) => setVoucherCount(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold focus:border-[#1976D2] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setManagingReseller(null)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] transition-colors"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
