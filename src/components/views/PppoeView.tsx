import React, { useState } from 'react';
import {
  Network,
  Users,
  Power,
  Server,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  KeyRound,
  FileCode,
  Plus,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  Radio,
  Zap,
  Trash2,
  ArrowDown,
  ArrowUp,
  X,
  CreditCard,
  Printer,
  Smartphone,
  Clock,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { Customer, ConnectionMedium, PaymentTransaction } from '../../types';

export const PppoeView: React.FC = () => {
  const {
    customers,
    packages,
    routers,
    sites,
    settings,
    ipPools,
    addIpPool,
    addCustomer,
    toggleCustomerStatus,
    deleteCustomer,
    disconnectPppoeSession,
    renewCustomerSubscription,
  } = useISP();

  const [activeTab, setActiveTab] = useState<'sessions' | 'secrets' | 'pools' | 'routeros_script'>('sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [coaToast, setCoaToast] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedScript, setCopiedScript] = useState(false);

  // Renewal & Payment Modal State
  const [renewingCustomer, setRenewingCustomer] = useState<Customer | null>(null);
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [renewalMethod, setRenewalMethod] = useState<'mpesa_stk' | 'mpesa_paybill' | 'cash'>('mpesa_stk');
  const [renewalPhone, setRenewalPhone] = useState('');
  const [renewalReceiptCode, setRenewalReceiptCode] = useState('');
  const [isProcessingRenewal, setIsProcessingRenewal] = useState(false);
  const [renewalSuccessMsg, setRenewalSuccessMsg] = useState<string | null>(null);
  const [stkSimPromptOpen, setStkSimPromptOpen] = useState(false);
  const [stkSimPin, setStkSimPin] = useState('••••');
  const [activePaymentReceipt, setActivePaymentReceipt] = useState<PaymentTransaction | null>(null);

  // Add PPPoE Secret Modal State
  const [isAddSecretModalOpen, setIsAddSecretModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState(settings.currency === 'KES' ? '2547' : '+1');
  const [newPackageId, setNewPackageId] = useState(packages[0]?.id || '');
  const [newConnectionMedium, setNewConnectionMedium] = useState<ConnectionMedium>('fiber');
  const [newStaticIp, setNewStaticIp] = useState('');
  const [newCallerId, setNewCallerId] = useState('');
  const [newPhysicalAddress, setNewPhysicalAddress] = useState('');

  // Add IP Pool Modal State
  const [isAddPoolModalOpen, setIsAddPoolModalOpen] = useState(false);
  const [poolName, setPoolName] = useState('pppoe-subscribers-west');
  const [poolRangeStart, setPoolRangeStart] = useState('10.100.4.2');
  const [poolRangeEnd, setPoolRangeEnd] = useState('10.100.7.254');
  const [poolSubnetMask, setPoolSubnetMask] = useState('/22');

  const pppoeCustomers = customers.filter((c) => c.serviceType === 'pppoe');
  const activeSessions = pppoeCustomers.filter((c) => c.status === 'active');

  const filteredSessions = activeSessions.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.pppoeUsername && c.pppoeUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.staticIp && c.staticIp.includes(searchTerm))
  );

  const filteredSecrets = pppoeCustomers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.pppoeUsername && c.pppoeUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDisconnectSession = (customerId: string, username?: string) => {
    disconnectPppoeSession(customerId);
    toggleCustomerStatus(customerId); // Terminate and suspend interface in AAA
    setCoaToast(`Sent RADIUS CoA Terminate-Session packet RFC 3576 for PPPoE user "${username || customerId}"`);
    setTimeout(() => setCoaToast(null), 4500);
  };

  const handleOpenRenewal = (cust: Customer) => {
    setRenewingCustomer(cust);
    setRenewalPhone(cust.phone);
    setRenewalMonths(1);
    setRenewalReceiptCode('');
    setRenewalSuccessMsg(null);
    setRenewalMethod('mpesa_stk');
    setStkSimPromptOpen(false);
  };

  const handleExecuteRenewal = async (method: 'mpesa_stk' | 'mpesa_paybill' | 'cash') => {
    if (!renewingCustomer) return;
    setIsProcessingRenewal(true);
    setRenewalSuccessMsg(null);
    setStkSimPromptOpen(false);

    try {
      const res = await renewCustomerSubscription(
        renewingCustomer.id,
        renewalMonths,
        method,
        method === 'mpesa_paybill' ? renewalReceiptCode.trim() : undefined
      );

      if (res.success && res.transaction) {
        setRenewalSuccessMsg(res.message);
        setActivePaymentReceipt(res.transaction);
        setCoaToast(
          `Renewed ${renewingCustomer.fullName} (+${renewalMonths} mo). RADIUS CoA sent to unblock MikroTik PPPoE interface.`
        );
        setTimeout(() => setCoaToast(null), 5000);
      } else {
        setRenewalSuccessMsg(res.message || 'Renewal failed. Please check customer details.');
      }
    } catch {
      setRenewalSuccessMsg('Error processing payment transaction. Please retry.');
    } finally {
      setIsProcessingRenewal(false);
    }
  };

  const handleCreateSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;

    addCustomer({
      tenantId: settings.tenantId,
      siteId: sites[0]?.id || 'site_default',
      routerId: routers[0]?.id || 'rt_default',
      fullName: newFullName.trim(),
      phone: newPhone.trim(),
      serviceType: 'pppoe',
      connectionMedium: newConnectionMedium,
      packageId: newPackageId || (packages[0]?.id ?? 'pkg_default'),
      status: 'active',
      pppoeUsername: newUsername.trim(),
      pppoePassword: newPassword.trim() || 'Pppoe@2026',
      staticIp: newStaticIp.trim() || undefined,
      callerIdMac: newCallerId.trim() || undefined,
      physicalAddress: newPhysicalAddress.trim() || 'Central Zone',
      autoRenew: true,
      expiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    });

    setIsAddSecretModalOpen(false);
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewPhone(settings.currency === 'KES' ? '2547' : '+1');
    setNewStaticIp('');
    setNewCallerId('');
    setNewPhysicalAddress('');

    setCoaToast(`Successfully provisioned PPPoE account "${newUsername.trim()}" in FreeRADIUS backend`);
    setTimeout(() => setCoaToast(null), 4000);
  };

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName.trim()) return;

    addIpPool({
      tenantId: settings.tenantId,
      siteId: sites[0]?.id || 'site_default',
      routerId: routers[0]?.id || 'rt_default',
      name: poolName.trim(),
      rangeStart: poolRangeStart.trim(),
      rangeEnd: poolRangeEnd.trim(),
      subnetMask: poolSubnetMask.trim(),
      poolType: 'pppoe_dynamic',
      totalIps: 1022,
    });

    setIsAddPoolModalOpen(false);
    setPoolName('');
    setCoaToast(`Registered IP Pool "${poolName.trim()}" (${poolRangeStart} - ${poolRangeEnd})`);
    setTimeout(() => setCoaToast(null), 4000);
  };

  const routerOsPppoeScript = `# =========================================================
# OmniISP Carrier-Grade PPPoE Server & FreeRADIUS Automation
# Company: ${settings.companyName} | Gateway: ${settings.radiusServerIp}
# =========================================================

# 1. Create Subscriber IP Address Pool
/ip pool add name="pppoe-subscribers-pool" ranges=10.100.1.2-10.100.3.254

# 2. Configure PPPoE AAA Profile with RADIUS Authentication
/ppp profile add \\
    name="OmniISP_PPPoE_Profile" \\
    local-address=10.100.1.1 \\
    remote-address="pppoe-subscribers-pool" \\
    use-radius=yes \\
    only-one=yes \\
    dns-server=1.1.1.1,8.8.8.8 \\
    change-tcp-mss=yes \\
    comment="OmniISP Central Dynamic PPPoE Profile"

# 3. Create PPPoE Server Binding on Concentrator Interfaces
/interface pppoe-server server add \\
    service-name="OmniPPPoE" \\
    interface=all \\
    default-profile="OmniISP_PPPoE_Profile" \\
    authentication=mschap2,chap,pap \\
    one-session-per-host=yes \\
    max-mru=1480 \\
    max-mtu=1480 \\
    keepalive-timeout=30 \\
    disabled=no

# 4. Configure FreeRADIUS AAA Client Integration
/radius add \\
    service=ppp \\
    address=${settings.radiusServerIp} \\
    secret="${settings.radiusSharedSecret}" \\
    authentication-port=${settings.radiusAuthPort} \\
    accounting-port=${settings.radiusAcctPort} \\
    timeout=3000ms

# 5. Enable RADIUS RFC 3576 CoA (Disconnect-Request / Dynamic Rate Changes)
/radius incoming set accept=yes port=3799

# 6. TCP MSS Clamping to prevent fragmentation on PPPoE tunnel
/ip firewall mangle add \\
    chain=forward \\
    action=change-mss \\
    new-mss=clamp-to-pmtu \\
    passthrough=yes \\
    tcp-flags=syn \\
    protocol=tcp \\
    comment="Clamp TCP MSS for PPPoE MTU 1480"
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(routerOsPppoeScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([routerOsPppoeScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omni_pppoe_server_setup_${Date.now()}.rsc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {coaToast && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-2xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{coaToast}</span>
          </div>
          <button onClick={() => setCoaToast(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            PPPoE Broadband Operations & Concentrators
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Centralized FreeRADIUS PPPoE authentication, active sessions, secrets management, and RFC 3576 CoA termination.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap rounded-lg border border-[#E2E8F0] bg-white p-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              activeTab === 'sessions'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Active Sessions ({activeSessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('secrets')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              activeTab === 'secrets'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>PPPoE Secrets ({pppoeCustomers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pools')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              activeTab === 'pools'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>IP Pools ({ipPools.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('routeros_script')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              activeTab === 'routeros_script'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>RouterOS Server Script</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>AAA Authentication Engine</span>
            <Server className="h-4 w-4 text-[#1976D2]" />
          </div>
          <div className="mt-2 text-base font-bold text-[#123B5D]">FreeRADIUS 3.x (PostgreSQL SQL)</div>
          <div className="mt-1 text-[11px] text-[#64748B]">PAP / CHAP / MSCHAPv2 Encryption</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Dynamic Subscriber Pool</span>
            <Layers className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-base font-bold text-[#123B5D]">10.100.0.0/22 (pppoe-pool)</div>
          <div className="mt-1 text-[11px] text-[#64748B]">Max 1024 Concurrent Subnets</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Session Enforcement</span>
            <ShieldCheck className="h-4 w-4 text-[#00B8D9]" />
          </div>
          <div className="mt-2 text-base font-bold text-[#123B5D]">RADIUS CoA (RFC 3576)</div>
          <div className="mt-1 text-[11px] text-[#64748B]">Port 3799 / Real-Time Disconnect</div>
        </div>
      </div>

      {/* SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by username, client name, account no, or IP..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => setIsAddSecretModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add PPPoE Secret</span>
            </button>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
                <Network className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-[#123B5D]">
                {pppoeCustomers.length === 0 ? 'No PPPoE subscribers created yet' : 'No active sessions match filter'}
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                {pppoeCustomers.length === 0
                  ? 'Click "Add PPPoE Secret" to provision your first customer into FreeRADIUS.'
                  : 'All registered PPPoE accounts are currently offline or suspended.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-[#F5F8FC] text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">PPPoE Username</th>
                    <th className="px-4 py-3 text-left font-semibold">Subscriber & Medium</th>
                    <th className="px-4 py-3 text-left font-semibold">Assigned IP / Caller MAC</th>
                    <th className="px-4 py-3 text-left font-semibold">Live Traffic (Rx / Tx)</th>
                    <th className="px-4 py-3 text-left font-semibold">Allocated Bandwidth</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">CoA Terminate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                  {filteredSessions.map((cust, idx) => {
                    const pkg = packages.find((p) => p.id === cust.packageId);
                    const assignedIp = cust.staticIp || `10.100.1.${idx + 10}`;
                    const simulatedDown = (1.4 + idx * 0.6).toFixed(1);
                    const simulatedUp = (240 + idx * 75).toFixed(0);

                    return (
                      <tr key={cust.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-[#123B5D] text-sm">
                            {cust.pppoeUsername || cust.phone}
                          </div>
                          <div className="text-[10px] text-[#64748B] font-mono">{cust.accountNumber}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#172B4D]">{cust.fullName}</div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                cust.connectionMedium === 'wireless'
                                  ? 'bg-amber-100 text-amber-800'
                                  : cust.connectionMedium === 'ethernet'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {cust.connectionMedium === 'wireless' ? (
                                <>
                                  <Radio className="h-2.5 w-2.5" />
                                  <span>Wireless FWA</span>
                                  {cust.wirelessSignalDbm && <span>({cust.wirelessSignalDbm} dBm)</span>}
                                </>
                              ) : cust.connectionMedium === 'ethernet' ? (
                                <>
                                  <Network className="h-2.5 w-2.5" />
                                  <span>Ethernet LAN</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="h-2.5 w-2.5" />
                                  <span>Fiber GPON</span>
                                </>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          <div className="text-[12px] font-bold text-[#123B5D]">{assignedIp}</div>
                          <div className="text-[10px] text-[#64748B]">
                            Caller-ID: {cust.callerIdMac || cust.macAddress || '48:8F:5A:11:22:33'}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-1 text-[#172B4D]">
                            <ArrowDown className="h-3 w-3 text-emerald-600" />
                            <span>{simulatedDown} GB</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#64748B] text-[10px]">
                            <ArrowUp className="h-3 w-3 text-blue-600" />
                            <span>{simulatedUp} MB</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#123B5D]">
                            {pkg?.name || 'Broadband Standard'}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            {pkg ? `${pkg.downloadSpeedMbps}M down / ${pkg.uploadSpeedMbps}M up` : '15M/10M'}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ONLINE
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenRenewal(cust)}
                              className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                              title="Renew / Pay Monthly Plan"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Renew / Pay</span>
                            </button>
                            <button
                              onClick={() => handleDisconnectSession(cust.id, cust.pppoeUsername || cust.fullName)}
                              className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                              title="Disconnect Live PPPoE Interface via RADIUS CoA"
                            >
                              <Power className="h-3 w-3" />
                              <span>Disconnect</span>
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
      )}

      {/* SECRETS TAB */}
      {activeTab === 'secrets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search secrets by username, phone, or subscriber..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => setIsAddSecretModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add PPPoE Secret</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">PPPoE Username</th>
                  <th className="px-4 py-3 text-left font-semibold">Secret Password</th>
                  <th className="px-4 py-3 text-left font-semibold">Subscriber & Account</th>
                  <th className="px-4 py-3 text-left font-semibold">Profile / Speed</th>
                  <th className="px-4 py-3 text-left font-semibold">Static IP / Pool</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredSecrets.map((cust) => {
                  const pkg = packages.find((p) => p.id === cust.packageId);
                  const isRevealed = revealedPasswords[cust.id];

                  return (
                    <tr key={cust.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#123B5D] text-sm">
                        {cust.pppoeUsername || cust.phone}
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#172B4D]">
                            {isRevealed ? cust.pppoePassword || 'Pppoe@2026' : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(cust.id)}
                            className="text-slate-400 hover:text-slate-600"
                            title={isRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#172B4D]">{cust.fullName}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{cust.accountNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#123B5D]">{pkg?.name || 'Broadband Standard'}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          {pkg ? `${pkg.downloadSpeedMbps}M / ${pkg.uploadSpeedMbps}M` : '15M/10M'}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {cust.staticIp ? (
                          <span className="text-[#1976D2] font-semibold">{cust.staticIp} (Static)</span>
                        ) : (
                          <span className="text-[#64748B]">Dynamic Pool</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCustomerStatus(cust.id)}
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                            cust.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {cust.status === 'active' ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRenewal(cust)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Renew / Pay Monthly Plan"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>Renew</span>
                          </button>
                          <button
                            onClick={() => toggleCustomerStatus(cust.id)}
                            className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-[#172B4D] hover:bg-slate-200"
                          >
                            {cust.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteCustomer(cust.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete PPPoE Secret"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POOLS TAB */}
      {activeTab === 'pools' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#123B5D]">Dynamic IP Subnet Pools</h3>
              <p className="text-xs text-[#64748B]">
                Subnet allocations for dynamic RADIUSFramed-IP-Address assignment.
              </p>
            </div>

            <button
              onClick={() => setIsAddPoolModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add IP Pool</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ipPools.map((pool) => {
              const allocated = pool.allocatedIps || 3;
              const total = pool.totalIps || 1022;
              const pct = Math.round((allocated / total) * 100);

              return (
                <div key={pool.id} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-[#123B5D]">{pool.name}</h4>
                      <div className="font-mono text-xs text-[#1976D2] mt-0.5">
                        {pool.rangeStart} &rarr; {pool.rangeEnd} ({pool.subnetMask})
                      </div>
                    </div>
                    <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                      {pool.poolType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-[#64748B] mb-1">
                      <span>Subnet Utilization</span>
                      <span className="font-semibold text-[#123B5D]">{allocated} / {total} IPs ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#1976D2] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                    <span>Gateway: 10.100.1.1</span>
                    <span>Free Leases: {total - allocated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROUTEROS SERVER SCRIPT TAB */}
      {activeTab === 'routeros_script' && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#123B5D]">
                MikroTik RouterOS PPPoE Concentrator & RADIUS Script
              </h3>
              <p className="text-xs text-[#64748B]">
                Copy and paste directly into your MikroTik terminal (`/terminal`) to instantiate the carrier PPPoE concentrator, TCP MSS clamp, and RADIUS AAA bindings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC] shadow-2xs"
              >
                {copiedScript ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-[#64748B]" />}
                <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
              </button>
              <button
                onClick={handleDownloadScript}
                className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#123B5D] transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download .rsc</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#0B2A43] p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[450px]">
            <pre>{routerOsPppoeScript}</pre>
          </div>
        </div>
      )}

      {/* MODAL: Add PPPoE Secret */}
      {isAddSecretModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#1976D2]" />
                Provision New PPPoE Secret
              </h3>
              <button onClick={() => setIsAddSecretModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSecret} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">PPPoE Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. jdoe_broadband"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. Secret#2026"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Customer / Subscriber Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Access Medium</label>
                  <select
                    value={newConnectionMedium}
                    onChange={(e) => setNewConnectionMedium(e.target.value as ConnectionMedium)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="fiber">Fiber Optic (GPON / FTTH)</option>
                    <option value="wireless">Fixed Wireless (PtMP / FWA)</option>
                    <option value="ethernet">Ethernet LAN (Direct Switch)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Bandwidth Plan Profile *</label>
                  <select
                    value={newPackageId}
                    onChange={(e) => setNewPackageId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-semibold"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.downloadSpeedMbps}M/{pkg.uploadSpeedMbps}M) - {settings.currency} {pkg.priceKes}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Static Framed-IP (Optional)</label>
                  <input
                    type="text"
                    value={newStaticIp}
                    onChange={(e) => setNewStaticIp(e.target.value)}
                    placeholder="Leave blank for dynamic pool"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Caller-ID MAC Lock (Optional)</label>
                  <input
                    type="text"
                    value={newCallerId}
                    onChange={(e) => setNewCallerId(e.target.value)}
                    placeholder="e.g. 48:8F:5A:11:22:33"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Physical Location / Address</label>
                <input
                  type="text"
                  value={newPhysicalAddress}
                  onChange={(e) => setNewPhysicalAddress(e.target.value)}
                  placeholder="e.g. 402 North Tower, Room 4"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddSecretModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D]"
                >
                  Save & Provision FreeRADIUS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add IP Pool */}
      {isAddPoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#1976D2]" />
                Add Dynamic IP Subnet Pool
              </h3>
              <button onClick={() => setIsAddPoolModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Pool Name *</label>
                <input
                  type="text"
                  required
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  placeholder="e.g. pppoe-subscribers-west"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Range Start *</label>
                  <input
                    type="text"
                    required
                    value={poolRangeStart}
                    onChange={(e) => setPoolRangeStart(e.target.value)}
                    placeholder="10.100.4.2"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Range End *</label>
                  <input
                    type="text"
                    required
                    value={poolRangeEnd}
                    onChange={(e) => setPoolRangeEnd(e.target.value)}
                    placeholder="10.100.7.254"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Subnet Mask</label>
                <input
                  type="text"
                  value={poolSubnetMask}
                  onChange={(e) => setPoolSubnetMask(e.target.value)}
                  placeholder="/22"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddPoolModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-slate-50"
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
      {/* MODAL: PPPoE Subscription Renewal & Real Payment */}
      {renewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#123B5D]">
                  Renew PPPoE Subscription
                </h3>
              </div>
              <button
                onClick={() => setRenewingCustomer(null)}
                className="text-[#64748B] hover:text-[#172B4D]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Subscriber Summary Strip */}
            {(() => {
              const pkg = packages.find((p) => p.id === renewingCustomer.packageId);
              const monthlyRate = pkg?.priceKes || 25;
              const totalAmount = monthlyRate * renewalMonths;
              const currentExpiry = renewingCustomer.expiresAt
                ? new Date(renewingCustomer.expiresAt).getTime()
                : 0;
              const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
              const newExpiryDate = new Date(baseTime + renewalMonths * 30 * 86400 * 1000);

              return (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] p-3 text-xs space-y-1.5 text-[#172B4D]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Subscriber:</span>
                      <span className="font-bold text-[#123B5D]">{renewingCustomer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Account / PPPoE Username:</span>
                      <span className="font-mono text-[#1976D2] font-semibold">
                        {renewingCustomer.accountNumber} ({renewingCustomer.pppoeUsername || renewingCustomer.phone})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Package Tier:</span>
                      <span className="font-semibold text-[#123B5D]">
                        {pkg?.name || 'Broadband Standard'} ({pkg?.downloadSpeedMbps}M/{pkg?.uploadSpeedMbps}M)
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="text-[#64748B]">Current Status & Expiry:</span>
                      <span className="font-bold text-slate-800">
                        {renewingCustomer.status.toUpperCase()} &bull;{' '}
                        {renewingCustomer.expiresAt
                          ? new Date(renewingCustomer.expiresAt).toLocaleDateString()
                          : 'No Term'}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>New Expiration Date:</span>
                      <span>{newExpiryDate.toLocaleDateString()} (+{renewalMonths} Month{renewalMonths > 1 ? 's' : ''})</span>
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Select Renewal Term:
                    </label>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {[1, 2, 3, 6].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRenewalMonths(m)}
                          className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                            renewalMonths === m
                              ? 'border-[#1976D2] bg-blue-50 text-[#1976D2] shadow-2xs'
                              : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50'
                          }`}
                        >
                          <div>{m} Mo{m > 1 ? 's' : ''}</div>
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                            {settings.currency} {monthlyRate * m}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                      Payment Channel:
                    </label>
                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#F5F8FC] p-1 border border-[#E2E8F0] text-xs font-bold text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRenewalMethod('mpesa_stk');
                          setRenewalSuccessMsg(null);
                        }}
                        className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                          renewalMethod === 'mpesa_stk'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                        }`}
                      >
                        M-Pesa STK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenewalMethod('mpesa_paybill');
                          setRenewalSuccessMsg(null);
                        }}
                        className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                          renewalMethod === 'mpesa_paybill'
                            ? 'bg-[#1976D2] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                        }`}
                      >
                        Paybill C2B
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenewalMethod('cash');
                          setRenewalSuccessMsg(null);
                        }}
                        className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                          renewalMethod === 'cash'
                            ? 'bg-[#123B5D] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                        }`}
                      >
                        Cash Counter
                      </button>
                    </div>
                  </div>

                  {/* PAYMENT TAB 1: M-PESA STK PUSH */}
                  {renewalMethod === 'mpesa_stk' && (
                    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                          <Smartphone className="h-4 w-4 text-emerald-700" />
                          Daraja STK Push to Phone
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Paybill {settings.mpesaShortcode}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                          Subscriber Safaricom Phone Number:
                        </label>
                        <input
                          type="text"
                          value={renewalPhone}
                          onChange={(e) => setRenewalPhone(e.target.value)}
                          placeholder="2547XXXXXXXX or 07XXXXXXXX"
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-sm font-semibold focus:border-emerald-600 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-[#64748B] mt-1">
                          A direct prompt will appear on the customer's phone requesting their M-Pesa PIN.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessingRenewal}
                        onClick={() => setStkSimPromptOpen(true)}
                        className="w-full rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        {isProcessingRenewal
                          ? 'Waiting for Daraja Callback...'
                          : `Send STK Prompt (${settings.currency} ${totalAmount})`}
                      </button>

                      {/* Live Daraja Prompt Simulator Overlay */}
                      {stkSimPromptOpen && (
                        <div className="rounded-xl border border-emerald-500 bg-[#0B2A43] p-3 text-white space-y-2 shadow-lg animate-in zoom-in-95">
                          <div className="flex items-center justify-between border-b border-emerald-500/40 pb-1">
                            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                              SIM Toolkit: Lipa na M-PESA
                            </span>
                            <button
                              type="button"
                              onClick={() => setStkSimPromptOpen(false)}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-200">
                            Pay <span className="font-bold text-emerald-400">{settings.currency} {totalAmount}</span> to <span className="font-bold text-white">{settings.companyName}</span> (Acc: <span className="font-mono text-emerald-300">{renewingCustomer.accountNumber}</span>)?
                          </p>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Enter M-Pesa PIN:</label>
                            <input
                              type="password"
                              maxLength={4}
                              value={stkSimPin}
                              onChange={(e) => setStkSimPin(e.target.value)}
                              className="w-full rounded bg-white/10 border border-emerald-500/50 p-2 font-mono text-center text-emerald-300 text-sm tracking-widest focus:outline-hidden"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setStkSimPromptOpen(false)}
                              className="rounded border border-slate-600 px-3 py-1 text-[11px] font-semibold text-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingRenewal}
                              onClick={() => handleExecuteRenewal('mpesa_stk')}
                              className="rounded bg-emerald-500 px-4 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                            >
                              Confirm PIN & Settle
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PAYMENT TAB 2: PAYBILL C2B MANUAL CODE */}
                  {renewalMethod === 'mpesa_paybill' && (
                    <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                          <Radio className="h-4 w-4 text-[#1976D2]" />
                          M-Pesa Paybill C2B
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                          Paybill: {settings.mpesaShortcode}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white border border-blue-200 p-2.5 text-[11px] space-y-1 text-[#172B4D]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Business Shortcode:</span>
                          <span className="font-mono font-bold text-[#123B5D]">{settings.mpesaShortcode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Account Number:</span>
                          <span className="font-mono font-bold text-[#1976D2]">{renewingCustomer.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Expected Amount:</span>
                          <span className="font-bold text-emerald-700">{settings.currency} {totalAmount}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                          Safaricom M-Pesa Transaction Code:
                        </label>
                        <input
                          type="text"
                          value={renewalReceiptCode}
                          onChange={(e) => setRenewalReceiptCode(e.target.value.toUpperCase())}
                          placeholder="e.g. QKH718293A"
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-center text-sm font-bold uppercase focus:border-[#1976D2] focus:outline-hidden"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isProcessingRenewal || !renewalReceiptCode.trim()}
                        onClick={() => handleExecuteRenewal('mpesa_paybill')}
                        className="w-full rounded-xl bg-[#123B5D] py-2.5 font-bold text-white hover:bg-[#0B2A43] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        {isProcessingRenewal ? 'Verifying Receipt Code...' : `Verify Code & Renew (${settings.currency} ${totalAmount})`}
                      </button>
                    </div>
                  )}

                  {/* PAYMENT TAB 3: CASH PAYMENT */}
                  {renewalMethod === 'cash' && (
                    <div className="space-y-3 rounded-2xl border border-slate-300 bg-slate-50 p-4 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#123B5D] text-xs">
                          Cash / Over-the-Counter Settlement
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                          NOC Counter
                        </span>
                      </div>

                      <p className="text-[11px] text-[#64748B]">
                        Acknowledge cash collection of <strong className="text-[#172B4D]">{settings.currency} {totalAmount}</strong> at the office desk. This will immediately issue a payment receipt and unblock the PPPoE connection on MikroTik.
                      </p>

                      <button
                        type="button"
                        disabled={isProcessingRenewal}
                        onClick={() => handleExecuteRenewal('cash')}
                        className="w-full rounded-xl bg-[#123B5D] py-2.5 font-bold text-white hover:bg-[#0B2A43] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        {isProcessingRenewal ? 'Recording Transaction...' : `Accept Cash & Settle (${settings.currency} ${totalAmount})`}
                      </button>
                    </div>
                  )}

                  {/* Renewal Success Notification */}
                  {renewalSuccessMsg && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{renewalSuccessMsg}</span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        MikroTik RADIUS CoA Disconnect sent. Subscriber status is now ACTIVE with full allocated speed profile.
                      </div>
                      {activePaymentReceipt && (
                        <button
                          type="button"
                          onClick={() => setActivePaymentReceipt(activePaymentReceipt)}
                          className="inline-flex items-center gap-1 font-bold text-[#1976D2] hover:underline pt-1"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>View Official Payment Receipt</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setRenewingCustomer(null)}
                      className="rounded-xl border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: Printable Official Payment Receipt */}
      {activePaymentReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#123B5D]">Official Electronic Payment Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1976D2] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#123B5D] cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentReceipt(null)}
                  className="text-[#64748B] hover:text-[#172B4D]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-[#FDFDFD] space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-base font-black text-[#123B5D]">{settings.companyName}</h4>
                  <p className="text-[11px] text-[#64748B]">{settings.countyCity}</p>
                  <p className="text-[11px] text-[#64748B]">Tel: {settings.supportPhone} &bull; Email: {settings.supportEmail}</p>
                </div>
                <div className="text-right">
                  <div className="rounded-lg bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 text-[11px] inline-block uppercase">
                    PAYMENT RECEIPT
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B] mt-1">
                    {new Date(activePaymentReceipt.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-[#64748B] block font-semibold">PAYMENT METHOD</span>
                  <span className="font-bold text-[#123B5D] uppercase">{activePaymentReceipt.method.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block font-semibold">RECEIPT REFERENCE</span>
                  <span className="font-mono font-bold text-emerald-700">{activePaymentReceipt.mpesaReceiptNumber || activePaymentReceipt.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block font-semibold">CUSTOMER CONTACT</span>
                  <span className="font-mono text-[#172B4D]">{activePaymentReceipt.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block font-semibold">TRANSACTION STATUS</span>
                  <span className="font-bold text-emerald-700 uppercase">SETTLED & ACTIVE</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-3 space-y-1.5">
                <div className="flex justify-between font-bold text-[#123B5D]">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>{activePaymentReceipt.description}</span>
                  <span className="font-bold text-[#172B4D]">{settings.currency} {activePaymentReceipt.amountKes.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-[#123B5D] pt-1">
                <span>TOTAL PAID</span>
                <span className="text-emerald-700">{settings.currency} {activePaymentReceipt.amountKes.toLocaleString()}</span>
              </div>

              <div className="text-center text-[10px] text-[#64748B] border-t border-slate-200 pt-3">
                <p>Thank you for choosing {settings.companyName}.</p>
                <p className="mt-0.5">High-speed broadband provisioned automatically via MikroTik FreeRADIUS AAA.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
