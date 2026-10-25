import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Trash2,
  X,
  Server,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';

export const PublicIpServicesView: React.FC = () => {
  const { publicIpServices, customers, routers, settings, addPublicIpService, revokePublicIpService } = useISP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publicIp, setPublicIp] = useState('197.232.45.10');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [routerId, setRouterId] = useState(routers[0]?.id || '');
  const [internalPrivateIp, setInternalPrivateIp] = useState('10.100.0.15');
  const [monthlyFeeKes, setMonthlyFeeKes] = useState(1500);

  const totalPublicIpMrr = publicIpServices.reduce((sum, p) => sum + p.monthlyFeeKes, 0);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicIp || !customerId) return;

    addPublicIpService({
      tenantId: settings.tenantId,
      publicIp,
      customerId,
      routerId: routerId || (routers[0]?.id ?? 'rt_01'),
      serviceType: '1:1_nat',
      datacenterGateway: settings.datacenterGatewayIp || '197.232.45.1',
      internalPrivateIp,
      monthlyFeeKes: Number(monthlyFeeKes),
      expiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Dedicated Public IP Services (Premium Add-on)
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Assign legitimate, routed public IPv4 addresses to subscribers behind CGNAT via 1:1 WireGuard NAT gateways.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Assign Public IP</span>
        </button>
      </div>

      {/* Executive Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Assigned IPv4</span>
            <Globe className="h-4 w-4 text-[#1976D2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">{publicIpServices.length}</div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            Active 1:1 NAT Sessions
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Monthly Add-on MRR</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            KES {totalPublicIpMrr.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">
            Recurring add-on billings
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Datacenter Gateway</span>
            <Server className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-[#123B5D]">
            {settings.datacenterGatewayIp || '197.232.45.1'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            BGP Multi-homed
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>IP Pool Subnet</span>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-[#123B5D]">
            197.232.45.0/24
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">
            AFRINIC Assigned Route
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-[#123B5D] space-y-2">
        <h4 className="font-bold flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-[#1976D2]" /> Section 7 Compliance: Routed Public IP Architecture
        </h4>
        <p className="text-[#64748B] text-[11px] leading-relaxed">
          Subscribers requesting public IPs for remote CCTV NVR access, hosting local gaming servers, or corporate VPNs are forwarded via our core data-centre gateway. Traffic is mapped 1:1 through a dedicated WireGuard tunnel to the subscriber's private address.
        </p>
      </div>

      {/* Public IP Services Table or Zero State */}
      {publicIpServices.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#123B5D]">No public IP services assigned yet</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            You can monetize dedicated public IPv4 addresses as a monthly add-on (typically KES 1,000 - 2,500/month) for eligible subscribers.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#123B5D]"
          >
            <Plus className="h-4 w-4" />
            <span>Assign First Public IP</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Public IPv4 Address</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned Subscriber</th>
                  <th className="px-4 py-3 text-left font-semibold">Internal IP (1:1 NAT)</th>
                  <th className="px-4 py-3 text-left font-semibold">Data Centre Gateway</th>
                  <th className="px-4 py-3 text-left font-semibold">Monthly Add-on</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {publicIpServices.map((pub) => {
                  const cust = customers.find((c) => c.id === pub.customerId);
                  return (
                    <tr key={pub.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#1976D2]">
                        {pub.publicIp}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#172B4D]">{cust?.fullName || 'Subscriber'}</div>
                        <div className="text-[10px] text-[#64748B]">{cust?.accountNumber}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-[#172B4D]">
                        {pub.internalPrivateIp}
                      </td>

                      <td className="px-4 py-3 font-mono text-[10px] text-[#64748B]">
                        {pub.datacenterGateway}
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-700">
                        KES {pub.monthlyFeeKes}/mo
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {pub.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => revokePublicIpService(pub.id)}
                          className="rounded bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {publicIpServices.map((pub) => {
              const cust = customers.find((c) => c.id === pub.customerId);
              return (
                <div
                  key={pub.id}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#1976D2]">{pub.publicIp}</div>
                      <div className="text-xs font-semibold text-[#172B4D] mt-0.5">{cust?.fullName}</div>
                    </div>
                    <span className="font-bold text-sm text-emerald-700">
                      KES {pub.monthlyFeeKes}/mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-slate-100">
                    <span className="font-mono">1:1 &rarr; {pub.internalPrivateIp}</span>
                    <button
                      onClick={() => revokePublicIpService(pub.id)}
                      className="text-xs font-semibold text-rose-700 hover:underline"
                    >
                      Revoke IP
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Assign Public IP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">Assign Dedicated Public IPv4</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Eligible Subscriber *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                >
                  <option value="">-- Choose Subscriber --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber}) - {c.serviceType.toUpperCase()}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    No subscribers created yet. Register a subscriber first.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Allocated Public IPv4 *</label>
                <input
                  type="text"
                  required
                  value={publicIp}
                  onChange={(e) => setPublicIp(e.target.value)}
                  placeholder="e.g. 197.232.45.88"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Subscriber Internal IP (1:1 Target)</label>
                <input
                  type="text"
                  required
                  value={internalPrivateIp}
                  onChange={(e) => setInternalPrivateIp(e.target.value)}
                  placeholder="10.100.0.X"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Monthly Add-on Charge (KES)</label>
                <input
                  type="number"
                  value={monthlyFeeKes}
                  onChange={(e) => setMonthlyFeeKes(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-bold text-[#123B5D] focus:outline-hidden"
                />
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
                  disabled={customers.length === 0}
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] disabled:opacity-50"
                >
                  Assign & Provision 1:1 NAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
