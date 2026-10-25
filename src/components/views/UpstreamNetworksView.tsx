import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  Shield,
  Layers,
  ArrowDownUp,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';

export const UpstreamNetworksView: React.FC = () => {
  const { upstreamConnections, addUpstreamConnection, deleteUpstreamConnection, routers, sites } = useISP();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [providerName, setProviderName] = useState<'Safaricom Fibre' | 'Faiba (JTL)' | 'Zuku Fibre' | 'Starlink' | 'Liquid Telecom' | 'Telkom Kenya' | 'Other'>('Safaricom Fibre');
  const [interfaceName, setInterfaceName] = useState('ether1');
  const [connectionType, setConnectionType] = useState<'dhcp' | 'static' | 'pppoe_upstream' | 'vlan'>('dhcp');
  const [assignedWanIp, setAssignedWanIp] = useState('100.64.12.45');
  const [gatewayIp, setGatewayIp] = useState('100.64.12.1');
  const [downloadSpeedLimitMbps, setDownloadSpeedLimitMbps] = useState(100);
  const [uploadSpeedLimitMbps, setUploadSpeedLimitMbps] = useState(100);
  const [isFailoverBackup, setIsFailoverBackup] = useState(false);
  const [routerId, setRouterId] = useState(routers[0]?.id || '');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');

  // Detect if IP is CGNAT (100.64.0.0/10 or RFC1918 10.x / 172.16.x / 192.168.x)
  const isCgnatDetected =
    assignedWanIp.startsWith('100.64.') ||
    assignedWanIp.startsWith('10.') ||
    assignedWanIp.startsWith('172.') ||
    assignedWanIp.startsWith('192.168.');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    addUpstreamConnection({
      tenantId: 'tenant_ke_001',
      siteId: siteId || 'site_default',
      routerId: routerId || (routers[0]?.id ?? 'rt_01'),
      providerName,
      interfaceName,
      connectionType,
      assignedWanIp,
      isCgnatRange: isCgnatDetected,
      observedPublicIp: isCgnatDetected ? '197.232.88.14' : assignedWanIp,
      gatewayIp,
      dnsServers: '8.8.8.8, 1.1.1.1',
      downloadSpeedLimitMbps: Number(downloadSpeedLimitMbps),
      uploadSpeedLimitMbps: Number(uploadSpeedLimitMbps),
      isFailoverBackup,
      priorityOrder: isFailoverBackup ? 2 : 1,
      status: 'active',
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Upstream Networks & Multi-WAN Failover
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage Safaricom, Faiba, Zuku, Starlink, and dedicated leased line upstream backhauls.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Upstream Backhaul</span>
        </button>
      </div>

      {/* Upstream Links Table or Zero State */}
      {upstreamConnections.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <Radio className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#123B5D]">No upstream backhaul connections registered</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Add your upstream WAN providers (e.g., Safaricom FTTH, JTL Faiba, Starlink satellite) to track bandwidth capacity, packet loss, and automatic failover routing.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#123B5D]"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Upstream Link</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
            <thead className="bg-[#F5F8FC] text-[#64748B]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Provider / Backhaul</th>
                <th className="px-4 py-3 text-left font-semibold">Interface</th>
                <th className="px-4 py-3 text-left font-semibold">Assigned WAN IP</th>
                <th className="px-4 py-3 text-left font-semibold">Addressing Type</th>
                <th className="px-4 py-3 text-left font-semibold">Capacity</th>
                <th className="px-4 py-3 text-left font-semibold">Status / Latency</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
              {upstreamConnections.map((u) => (
                <tr key={u.id} className="hover:bg-[#F5F8FC]/60">
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#123B5D] block">{u.providerName}</span>
                    <span className="text-[10px] text-[#64748B]">
                      {u.isFailoverBackup ? 'Secondary (Failover Backup)' : 'Primary WAN'}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-[#1976D2]">
                    {u.interfaceName}
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <span className="text-xs font-semibold text-[#172B4D]">{u.assignedWanIp}</span>
                    {u.isCgnatRange && (
                      <span className="block text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded w-fit mt-0.5">
                        CGNAT Detected (100.64.0.0/10)
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="uppercase text-[10px] font-semibold text-[#64748B]">
                      {u.connectionType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#123B5D]">
                    {u.downloadSpeedLimitMbps}M / {u.uploadSpeedLimitMbps}M
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-emerald-800">ONLINE</span>
                      <span className="text-[10px] text-[#64748B] font-mono">({u.latencyMs}ms)</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteUpstreamConnection(u.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Upstream */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">Add Upstream Network Link</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Upstream Provider *</label>
                <select
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value as any)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                >
                  <option value="Safaricom Fibre">Safaricom Fibre (FTTH / Dedicated)</option>
                  <option value="Faiba (JTL)">Faiba (Jamii Telecommunications)</option>
                  <option value="Zuku Fibre">Zuku Fibre (Wananchi Group)</option>
                  <option value="Starlink">Starlink Satellite Backhaul</option>
                  <option value="Liquid Telecom">Liquid Telecom / Intelligent Tech</option>
                  <option value="Telkom Kenya">Telkom Kenya Carrier</option>
                  <option value="Other">Other Metro Ethernet Link</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Interface Name *</label>
                  <input
                    type="text"
                    required
                    value={interfaceName}
                    onChange={(e) => setInterfaceName(e.target.value)}
                    placeholder="ether1 or sfp1"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Addressing Type</label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  >
                    <option value="dhcp">DHCP Client (Dynamic)</option>
                    <option value="static">Static IP Configuration</option>
                    <option value="pppoe_upstream">PPPoE Client</option>
                    <option value="vlan">VLAN Tagged Trunk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Assigned WAN IP</label>
                  <input
                    type="text"
                    value={assignedWanIp}
                    onChange={(e) => setAssignedWanIp(e.target.value)}
                    placeholder="e.g. 100.64.12.45"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Gateway IP</label>
                  <input
                    type="text"
                    value={gatewayIp}
                    onChange={(e) => setGatewayIp(e.target.value)}
                    placeholder="e.g. 100.64.12.1"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Download Bandwidth (Mbps)</label>
                  <input
                    type="number"
                    value={downloadSpeedLimitMbps}
                    onChange={(e) => setDownloadSpeedLimitMbps(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Upload Bandwidth (Mbps)</label>
                  <input
                    type="number"
                    value={uploadSpeedLimitMbps}
                    onChange={(e) => setUploadSpeedLimitMbps(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFailoverBackup}
                  onChange={(e) => setIsFailoverBackup(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#1976D2] focus:ring-[#1976D2]"
                />
                <span className="font-semibold text-[#172B4D]">
                  Mark as Failover Backup Link (Engage on primary failure)
                </span>
              </label>

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
                  Save Upstream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
