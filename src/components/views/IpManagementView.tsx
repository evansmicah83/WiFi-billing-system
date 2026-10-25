import React, { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Layers,
  ShieldCheck,
  Trash2,
  X,
  Search,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { IpPool } from '../../types';

export const IpManagementView: React.FC = () => {
  const { ipPools, addIpPool, deleteIpPool, routers, customers } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poolToDelete, setPoolToDelete] = useState<IpPool | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [rangeStart, setRangeStart] = useState('10.100.0.10');
  const [rangeEnd, setRangeEnd] = useState('10.100.3.250');
  const [subnetMask, setSubnetMask] = useState('/22');
  const [poolType, setPoolType] = useState<
    'hotspot_dhcp' | 'pppoe_dynamic' | 'static_subscribers' | 'cgnat_shared' | 'management_vpn'
  >('pppoe_dynamic');
  const [totalIps, setTotalIps] = useState(1020);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered pools
  const filteredPools = useMemo(() => {
    return ipPools.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rangeStart.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rangeEnd.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || p.poolType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [ipPools, searchTerm, selectedType]);

  // Derived Dynamic Metrics
  const totalPools = ipPools.length;
  const totalCapacity = ipPools.reduce((sum, p) => sum + (p.totalIps || 0), 0);
  const totalAllocated = customers.filter((c) => c.status === 'active').length;
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rangeStart.trim()) return;

    addIpPool({
      tenantId: 'tenant_ke_001',
      siteId: 'site_default',
      routerId: routers[0]?.id || 'rt_01',
      name: name.trim(),
      rangeStart: rangeStart.trim(),
      rangeEnd: rangeEnd.trim(),
      subnetMask: subnetMask.trim(),
      poolType,
      totalIps: Number(totalIps) || 254,
    });

    setIsModalOpen(false);
    showToast(`Created IP pool "${name.trim()}"`);
    setName('');
  };

  const confirmDelete = () => {
    if (!poolToDelete) return;
    deleteIpPool(poolToDelete.id);
    setPoolToDelete(null);
    showToast('IP pool removed.');
  };

  const handleQuickPreset = (pName: string, pStart: string, pEnd: string, pMask: string, pType: any, pCount: number) => {
    addIpPool({
      tenantId: 'tenant_ke_001',
      siteId: 'site_default',
      routerId: routers[0]?.id || 'rt_01',
      name: pName,
      rangeStart: pStart,
      rangeEnd: pEnd,
      subnetMask: pMask,
      poolType: pType,
      totalIps: pCount,
    });
    showToast(`Added standard IP pool: ${pName}`);
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
            IP Address Management (IPAM)
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Subnet planning, subscriber address pools, CGNAT blocks, and management VPN allocations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add IP Pool</span>
        </button>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Configured Pools</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#1976D2]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalPools}</span>
            <span className="text-xs text-[#64748B]">subnets</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">PPPoE, Hotspot & CGNAT</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Total IP Capacity</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalCapacity}</span>
            <span className="text-xs text-[#64748B]">addresses</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Ready for allocation</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Active Leases</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{totalAllocated}</span>
            <span className="text-xs text-[#64748B]">subscribers</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Live authenticated sessions</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Pool Utilization</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Sliders className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{utilizationPercent}%</span>
            <span className="text-xs text-[#64748B]">used</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">Sufficient capacity available</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pool name, IP prefix..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-xs text-[#172B4D] placeholder-[#64748B] focus:border-[#1976D2] focus:outline-hidden"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-[#64748B]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Pools' },
            { id: 'pppoe_dynamic', label: 'PPPoE Dynamic' },
            { id: 'hotspot_dhcp', label: 'Hotspot DHCP' },
            { id: 'cgnat_shared', label: 'CGNAT Shared' },
            { id: 'management_vpn', label: 'Management VPN' },
          ].map((tp) => (
            <button
              key={tp.id}
              onClick={() => setSelectedType(tp.id)}
              className={`rounded-lg px-2.5 py-1.5 font-semibold whitespace-nowrap transition-colors ${
                selectedType === tp.id
                  ? 'bg-[#123B5D] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table or Card View */}
      {ipPools.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1976D2]">
            <Globe className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No IP address pools defined yet</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mt-1">
              Define pools for Hotspot DHCP (<code className="font-mono text-blue-700">10.50.0.0/22</code>), PPPoE subscribers (<code className="font-mono text-blue-700">10.100.0.0/22</code>), or management VPN blocks.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First IP Pool</span>
            </button>
          </div>

          {/* Quick Setup Presets */}
          <div className="pt-4 border-t border-[#E2E8F0] max-w-xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Or quick-initialize with standard ISP address pools:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() =>
                  handleQuickPreset('sln-pppoe-pool', '10.100.0.10', '10.100.3.250', '/22', 'pppoe_dynamic', 1015)
                }
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">PPPoE Subscriber Pool</div>
                <div className="text-[10px] text-[#64748B]">10.100.0.0/22 • 1,015 IPs</div>
              </button>
              <button
                onClick={() =>
                  handleQuickPreset('sln-hotspot-pool', '10.50.0.10', '10.50.3.250', '/22', 'hotspot_dhcp', 1015)
                }
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Hotspot Guest Pool</div>
                <div className="text-[10px] text-[#64748B]">10.50.0.0/22 • 1,015 IPs</div>
              </button>
              <button
                onClick={() =>
                  handleQuickPreset('sln-mgmt-vpn', '10.254.0.5', '10.254.0.250', '/24', 'management_vpn', 246)
                }
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">WireGuard CGNAT Pool</div>
                <div className="text-[10px] text-[#64748B]">10.254.0.0/24 • 246 IPs</div>
              </button>
            </div>
          </div>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <p className="text-xs text-[#64748B]">No pools match the search query "{searchTerm}".</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
            }}
            className="mt-2 text-xs font-semibold text-[#1976D2] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Pool Name</th>
                  <th className="px-4 py-3 text-left font-semibold">IP Range / Subnet</th>
                  <th className="px-4 py-3 text-left font-semibold">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold">Capacity</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredPools.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#123B5D]">{p.name}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className="font-bold text-[#1976D2]">
                        {p.rangeStart} - {p.rangeEnd}
                      </span>{' '}
                      <span className="text-[#64748B] font-semibold">({p.subnetMask})</span>
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold">
                      <span className="rounded bg-blue-50 text-[#1976D2] px-2 py-0.5">
                        {p.poolType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#172B4D]">
                      {p.totalIps.toLocaleString()} Total Addresses
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setPoolToDelete(p)}
                        className="text-[#64748B] hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition-colors"
                        title="Delete Pool"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredPools.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#123B5D]">{p.name}</span>
                  <span className="rounded bg-blue-50 text-[#1976D2] px-2 py-0.5 text-[10px] font-bold uppercase">
                    {p.poolType.replace('_', ' ')}
                  </span>
                </div>

                <div className="rounded-lg bg-[#F5F8FC] p-2.5 font-mono text-xs">
                  <div className="font-bold text-[#1976D2]">{p.rangeStart} - {p.rangeEnd}</div>
                  <div className="text-[10px] text-[#64748B]">Mask: {p.subnetMask} • {p.totalIps} Addresses</div>
                </div>

                <div className="flex justify-end pt-1 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => setPoolToDelete(p)}
                    className="p-1 text-[#64748B] hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: Add IP Pool */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">Add IP Address Pool</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Pool Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. sln-pppoe-pool"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Purpose / Service Type</label>
                <select
                  value={poolType}
                  onChange={(e) => setPoolType(e.target.value as any)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="pppoe_dynamic">PPPoE Dynamic Subscribers</option>
                  <option value="hotspot_dhcp">Hotspot DHCP Captive Portal</option>
                  <option value="cgnat_shared">CGNAT Shared NAT Pool</option>
                  <option value="management_vpn">WireGuard Management VPN</option>
                  <option value="static_subscribers">Corporate Static IPs</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Range Start *</label>
                  <input
                    type="text"
                    required
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    placeholder="10.100.0.10"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Range End *</label>
                  <input
                    type="text"
                    required
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    placeholder="10.100.3.250"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Subnet Mask</label>
                  <input
                    type="text"
                    value={subnetMask}
                    onChange={(e) => setSubnetMask(e.target.value)}
                    placeholder="/22 or 255.255.252.0"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Usable IP Count</label>
                  <input
                    type="number"
                    value={totalIps}
                    onChange={(e) => setTotalIps(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D]"
                >
                  Save IP Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Modal: Delete IP Pool */}
      {poolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#123B5D]">Delete IP Pool?</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete pool <span className="font-bold text-[#123B5D]">{poolToDelete.name}</span> ({poolToDelete.rangeStart} - {poolToDelete.rangeEnd})?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setPoolToDelete(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#172B4D]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Yes, Delete Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
