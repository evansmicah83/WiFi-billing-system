import React, { useState, useMemo } from 'react';
import {
  Wifi,
  Smartphone,
  CreditCard,
  Ticket,
  Power,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Radio,
  Download,
  Copy,
  Check,
  Users,
  ArrowDown,
  ArrowUp,
  Clock,
  FileCode,
  Printer,
  Plus,
  AlertCircle,
  Filter,
  DollarSign,
  Layers,
  Lock,
  Globe,
  Activity,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { HotspotVoucher } from '../../types';

export const HotspotView: React.FC = () => {
  const {
    vouchers,
    packages,
    settings,
    sites,
    redeemVoucher,
    disconnectHotspotSession,
    generateVouchersBatch,
    revokeVoucher,
    initiateMpesaStkPush,
    purchaseHotspotPassOnline,
    verifyMpesaC2bPayment,
  } = useISP();

  const [activeTab, setActiveTab] = useState<'sessions' | 'vouchers' | 'portal_preview' | 'routeros_script'>('sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [portalPhoneInput, setPortalPhoneInput] = useState(
    settings.currency === 'KES' ? '0712345678' : '+15550199'
  );
  const [selectedPackageId, setSelectedPackageId] = useState(
    packages.find((p) => p.serviceType === 'hotspot')?.id || packages[0]?.id || ''
  );
  const [portalPayMode, setPortalPayMode] = useState<'stk' | 'paybill' | 'voucher'>('stk');
  const [portalPaybillReceipt, setPortalPaybillReceipt] = useState('');
  const [stkPromptOpen, setStkPromptOpen] = useState(false);
  const [stkPinInput, setStkPinInput] = useState('••••');
  const [portalMsg, setPortalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [coaToast, setCoaToast] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Voucher batch generator modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [batchPackageId, setBatchPackageId] = useState(
    packages.find((p) => p.serviceType === 'hotspot')?.id || packages[0]?.id || ''
  );
  const [batchCount, setBatchCount] = useState(25);
  const [batchPrefix, setBatchPrefix] = useState(
    settings.companyName ? settings.companyName.substring(0, 3).toUpperCase() : 'WIFI'
  );

  // Simulated client device
  const clientMac = '44:91:60:E2:19:B4';

  // Active Hotspot Sessions (status === 'in_use')
  const activeSessions = useMemo(() => vouchers.filter((v) => v.status === 'in_use'), [vouchers]);
  const availableVouchers = useMemo(() => vouchers.filter((v) => v.status === 'available'), [vouchers]);

  // Unique batches
  const availableBatches = useMemo(() => {
    return Array.from(new Set(vouchers.map((v) => v.batchId))).filter(Boolean);
  }, [vouchers]);

  // Total Hotspot Revenue from used / in-use vouchers
  const totalHotspotRevenue = useMemo(() => {
    return vouchers
      .filter((v) => v.status === 'in_use' || v.status === 'used')
      .reduce((sum, v) => sum + (v.priceKes || 0), 0);
  }, [vouchers]);

  // Combined traffic in MB
  const totalTrafficMb = useMemo(() => {
    const totalBytes = activeSessions.reduce(
      (sum, s) => sum + (s.bytesIn || 0) + (s.bytesOut || 0),
      0
    );
    return (totalBytes / (1024 * 1024)).toFixed(1);
  }, [activeSessions]);

  // Check if simulated client is currently connected
  const clientCurrentSession = activeSessions.find(
    (s) => s.usedByMac === clientMac || s.usedByPhone === portalPhoneInput
  );

  const filteredSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.code.toLowerCase().includes(q) ||
        (s.usedByMac && s.usedByMac.toLowerCase().includes(q)) ||
        (s.ipAddress && s.ipAddress.includes(q)) ||
        (s.usedByPhone && s.usedByPhone.includes(q)) ||
        (s.batchId && s.batchId.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [activeSessions, searchTerm]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        v.code.toLowerCase().includes(q) ||
        v.batchId.toLowerCase().includes(q) ||
        (v.usedByMac && v.usedByMac.toLowerCase().includes(q)) ||
        (v.pin && v.pin.includes(q));

      const matchesBatch = batchFilter === 'all' || v.batchId === batchFilter;
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

      return matchesSearch && matchesBatch && matchesStatus;
    });
  }, [vouchers, searchTerm, batchFilter, statusFilter]);

  const handleDisconnect = (voucherId: string, mac?: string) => {
    disconnectHotspotSession(voucherId);
    setCoaToast(`Sent RADIUS CoA Disconnect-Request RFC 3576 for Client MAC ${mac || 'Session'}. Session terminated.`);
    setTimeout(() => setCoaToast(null), 4000);
  };

  const handlePortalVoucherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCodeInput.trim()) return;
    const res = redeemVoucher(voucherCodeInput.trim(), portalPhoneInput, clientMac);
    if (res.success) {
      setPortalMsg({ type: 'success', text: res.message });
      setVoucherCodeInput('');
    } else {
      setPortalMsg({ type: 'error', text: res.message });
    }
  };

  const handleTriggerStkPrompt = () => {
    if (!portalPhoneInput || portalPhoneInput.length < 9) {
      setPortalMsg({ type: 'error', text: 'Please enter a valid phone number (e.g. 0712345678)' });
      return;
    }
    setPortalMsg(null);
    setStkPromptOpen(true);
  };

  const handleConfirmStkPush = async () => {
    const pkg = packages.find((p) => p.id === selectedPackageId);
    const amount = pkg?.priceKes || 3;

    setIsBuying(true);
    setStkPromptOpen(false);
    setPortalMsg(null);

    try {
      const res = await purchaseHotspotPassOnline(
        portalPhoneInput,
        selectedPackageId,
        'mpesa_stk',
        undefined,
        clientMac
      );

      if (res.success && res.voucher) {
        setPortalMsg({
          type: 'success',
          text: `Payment confirmed! Safaricom Receipt: ${res.transaction?.mpesaReceiptNumber}. Voucher ${res.voucher.code} is active.`,
        });
        setCoaToast(`High-Speed Wi-Fi activated for MAC ${clientMac}. M-Pesa Receipt: ${res.transaction?.mpesaReceiptNumber}`);
        setTimeout(() => setCoaToast(null), 5000);
      } else {
        setPortalMsg({ type: 'error', text: res.message || 'Payment processing failed.' });
      }
    } catch {
      setPortalMsg({ type: 'error', text: 'Could not process M-Pesa STK push. Please check your phone connection.' });
    } finally {
      setIsBuying(false);
    }
  };

  const handlePortalPaybillVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalPaybillReceipt.trim()) {
      setPortalMsg({ type: 'error', text: 'Enter the M-Pesa confirmation code received via SMS (e.g. QKH718293A)' });
      return;
    }
    if (!portalPhoneInput || portalPhoneInput.length < 5) {
      setPortalMsg({ type: 'error', text: 'Please enter the phone number used to make the Paybill payment.' });
      return;
    }

    const pkg = packages.find((p) => p.id === selectedPackageId);
    const amount = pkg?.priceKes || 3;

    setIsBuying(true);
    setPortalMsg(null);

    try {
      const res = await purchaseHotspotPassOnline(
        portalPhoneInput,
        selectedPackageId,
        'mpesa_paybill',
        portalPaybillReceipt.trim(),
        clientMac
      );

      if (res.success && res.voucher) {
        setPortalMsg({
          type: 'success',
          text: `Paybill verified (${portalPaybillReceipt.trim().toUpperCase()})! Voucher ${res.voucher.code} is active.`,
        });
        setPortalPaybillReceipt('');
        setCoaToast(`High-Speed Wi-Fi activated via Paybill verification for ${clientMac}`);
        setTimeout(() => setCoaToast(null), 5000);
      } else {
        setPortalMsg({ type: 'error', text: res.message });
      }
    } catch {
      setPortalMsg({ type: 'error', text: 'Verification error. Ensure receipt code is correct.' });
    } finally {
      setIsBuying(false);
    }
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const created = generateVouchersBatch(batchPackageId, batchCount, batchPrefix);
    setIsGenerateModalOpen(false);
    setCoaToast(`Generated ${created.length} new vouchers for ${packages.find((p) => p.id === batchPackageId)?.name || 'Hotspot'}`);
    setTimeout(() => setCoaToast(null), 4000);
  };

  const handleCopyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  const handleExportCsv = () => {
    if (vouchers.length === 0) return;
    const headers = ['Voucher Code', 'PIN', `Price (${settings.currency})`, 'Status', 'Batch ID', 'IP Address', 'MAC', 'Created At'];
    const rows = vouchers.map((v) => [
      v.code,
      v.pin || '',
      v.priceKes,
      v.status,
      v.batchId,
      v.ipAddress || '',
      v.usedByMac || '',
      v.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotspot_vouchers_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const routerOsScript = `# =========================================================
# Carrier-Grade MikroTik Hotspot & FreeRADIUS Automation
# Provider: ${settings.companyName}
# Gateway IP: ${settings.radiusServerIp} | Timezone: ${settings.timezone}
# =========================================================

# 1. Hotspot Guest IP Address Pool
/ip pool add name="hotspot-guest-pool" ranges=10.50.0.10-10.50.3.250

# 2. Hotspot Server Profile with FreeRADIUS RFC 3576 CoA
/ip hotspot profile add \\
    name="OmniISP_Hotspot_Profile" \\
    hotspot-address=10.50.0.1 \\
    dns-name="wifi.login" \\
    html-directory="hotspot" \\
    use-radius=yes \\
    radius-accounting=yes \\
    radius-interim-update=5m \\
    login-by=http-chap,cookie,http-pap

# 3. Bind Hotspot Server to Interface
/ip hotspot add \\
    name="OmniHotspot_Main" \\
    interface=wlan1 \\
    address-pool="hotspot-guest-pool" \\
    profile="OmniISP_Hotspot_Profile" \\
    disabled=no

# 4. Configure FreeRADIUS AAA Client Integration
/radius add \\
    service=hotspot \\
    address=${settings.radiusServerIp} \\
    secret="${settings.radiusSharedSecret}" \\
    authentication-port=${settings.radiusAuthPort} \\
    accounting-port=${settings.radiusAcctPort} \\
    timeout=3000ms

# 5. Enable RADIUS RFC 3576 CoA (Disconnect-Request port 3799)
/radius incoming set accept=yes port=3799

# 6. Walled Garden for Payment Gateways & Captive Checks
/ip hotspot walled-garden ip add action=accept dst-host="*safaricom.co.ke" comment="Daraja M-Pesa"
/ip hotspot walled-garden ip add action=accept dst-host="*stripe.com" comment="Card Gateway"
/ip hotspot walled-garden ip add action=accept dst-host="captive.apple.com" comment="Apple CNA"
/ip hotspot walled-garden ip add action=accept dst-host="connectivitycheck.gstatic.com" comment="Android CNA"

# 7. Hotspot User Default Bandwidth Profile
/ip hotspot user profile set [ find default=yes ] \\
    rate-limit="10M/10M" \\
    shared-users=1 \\
    transparent-proxy=no
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(routerOsScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([routerOsScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hotspot_routeros_setup_${Date.now()}.rsc`;
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

      {/* Top Header: Identity & Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#123B5D]">
              Hotspot Controller & Captive Engine
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              RADIUS AAA Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time guest sessions, FreeRADIUS RFC 3576 CoA disconnect, multi-batch voucher production, and captive portal management.
          </p>
        </div>

        {/* Global Hotspot Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Vouchers</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC] transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-[#1976D2]" />
            <span>Print Cards Sheet</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Executive Financial & Session KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Live Sessions */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active Online Guests</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#1976D2]">
              <Wifi className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#123B5D]">{activeSessions.length}</span>
            <span className="text-xs text-[#64748B]">concurrent devices</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {totalTrafficMb} MB Traffic
            </span>
            <span className="font-mono text-[10px]">10.50.0.0/22</span>
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Hotspot Revenue (Gross)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#123B5D]">
              {settings.currency} {totalHotspotRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">Vouchers & Portal Checkout</span>
            <span>Reconciled</span>
          </div>
        </div>

        {/* KPI 3: Available Stock */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Available Voucher Stock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#123B5D]">{availableVouchers.length}</span>
            <span className="text-xs text-[#64748B]">of {vouchers.length} cards</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span>{availableBatches.length} Batches Generated</span>
            {availableVouchers.length < 5 ? (
              <span className="text-amber-700 font-semibold">Low Stock</span>
            ) : (
              <span className="text-emerald-600 font-semibold">In Stock</span>
            )}
          </div>
        </div>

        {/* KPI 4: RADIUS CoA Gateway */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Enforcement Engine</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-[#00B8D9]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#123B5D]">RFC 3576 CoA</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span>Port 3799 / Disconnect-Req</span>
            <span className="text-emerald-600 font-bold">Enabled</span>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2">
        <div className="flex flex-wrap rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === 'sessions'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <Wifi className="h-4 w-4" />
            <span>Active Sessions</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === 'sessions' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#64748B]'
            }`}>
              {activeSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === 'vouchers'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>Vouchers & Inventory</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === 'vouchers' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#64748B]'
            }`}>
              {vouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('portal_preview')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === 'portal_preview'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Captive Portal Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('routeros_script')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === 'routeros_script'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>RouterOS .rsc Script</span>
          </button>
        </div>

        {activeTab === 'sessions' && (
          <div className="text-xs text-[#64748B] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Session Polling Active</span>
          </div>
        )}
      </div>

      {/* TAB 1: ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by IP, MAC, voucher code, or phone..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('portal_preview')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC]"
              >
                <Smartphone className="h-3.5 w-3.5 text-[#1976D2]" />
                <span>Test Live Captive Portal</span>
              </button>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center shadow-2xs space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-[#00B8D9]">
                <Wifi className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-[#123B5D]">No Active Hotspot Sessions</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                {searchTerm
                  ? 'No active sessions match your search query.'
                  : 'Guests who authenticate via voucher code or online checkout at your Wi-Fi hotspots will appear here in real time with IP, MAC, live Tx/Rx bytes, and CoA disconnect.'}
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('portal_preview')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-bold text-white hover:bg-[#123B5D] transition-colors"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Open Portal Simulator</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
                <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                  <thead className="bg-[#F5F8FC] text-[#64748B]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Voucher / Code</th>
                      <th className="px-4 py-3 text-left font-semibold">Client IP & Hardware MAC</th>
                      <th className="px-4 py-3 text-left font-semibold">Data Transferred (Rx / Tx)</th>
                      <th className="px-4 py-3 text-left font-semibold">Tier Rate Profile</th>
                      <th className="px-4 py-3 text-left font-semibold">Session Uptime</th>
                      <th className="px-4 py-3 text-left font-semibold">Expiry</th>
                      <th className="px-4 py-3 text-right font-semibold">RADIUS CoA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                    {filteredSessions.map((session) => {
                      const pkg = packages.find((p) => p.id === session.packageId);
                      const bytesDown = session.bytesIn ? (session.bytesIn / (1024 * 1024)).toFixed(1) : '342.8';
                      const bytesUp = session.bytesOut ? (session.bytesOut / (1024 * 1024)).toFixed(1) : '48.1';

                      return (
                        <tr key={session.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#123B5D] text-[13px]">{session.code}</span>
                              <button
                                onClick={() => handleCopyVoucherCode(session.code)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy Code"
                              >
                                {copiedVoucher === session.code ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <span className="block text-[10px] text-[#64748B]">Batch: {session.batchId}</span>
                          </td>

                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-[#123B5D] text-xs flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                              <span>{session.ipAddress || '10.50.0.124'}</span>
                            </div>
                            <div className="text-[11px] text-[#64748B] mt-0.5">
                              {session.usedByMac || '44:91:60:E2:19:B4'}
                            </div>
                            {session.usedByPhone && (
                              <div className="text-[10px] text-[#1976D2] font-sans mt-0.5">
                                {session.usedByPhone}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 font-mono">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                              <ArrowDown className="h-3 w-3 text-emerald-600" />
                              <span>{bytesDown} MB</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-700 text-[11px] mt-0.5">
                              <ArrowUp className="h-3 w-3 text-blue-500" />
                              <span>{bytesUp} MB</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#123B5D]">{pkg?.name || 'Wi-Fi Day Pass'}</div>
                            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              {pkg ? `${pkg.downloadSpeedMbps}M / ${pkg.uploadSpeedMbps}M` : '10 Mbps / 5 Mbps'}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-[#64748B]">
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>
                                {session.uptimeSeconds
                                  ? `${Math.floor(session.uptimeSeconds / 60)} mins`
                                  : 'Just joined'}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-[#64748B]">
                            {session.expiresAt ? (
                              <div className="text-[11px]">
                                {new Date(session.expiresAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            ) : (
                              'Unlimited'
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDisconnect(session.id, session.usedByMac)}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                              title="Disconnect Session via RADIUS RFC 3576 CoA"
                            >
                              <Power className="h-3.5 w-3.5" />
                              <span>Kick / CoA</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredSessions.map((session) => {
                  const pkg = packages.find((p) => p.id === session.packageId);
                  const bytesDown = session.bytesIn ? (session.bytesIn / (1024 * 1024)).toFixed(1) : '342.8';
                  const bytesUp = session.bytesOut ? (session.bytesOut / (1024 * 1024)).toFixed(1) : '48.1';

                  return (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#123B5D]">
                            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{session.code}</span>
                          </div>
                          <div className="text-xs font-semibold text-[#172B4D] mt-0.5">
                            {pkg?.name || 'Wi-Fi Pass'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDisconnect(session.id, session.usedByMac)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700"
                        >
                          <Power className="h-3 w-3" />
                          <span>Kick</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F8FC] p-2.5 rounded-xl font-mono">
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-sans">IP Address</span>
                          <span className="font-bold text-[#123B5D]">{session.ipAddress || '10.50.0.124'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-sans">Device MAC</span>
                          <span className="text-[#64748B] text-[11px] truncate block">
                            {session.usedByMac || '44:91:60:E2:19:B4'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold font-mono">↓ {bytesDown} MB</span>
                          <span className="text-blue-700 font-semibold font-mono">↑ {bytesUp} MB</span>
                        </div>
                        <span>{session.uptimeSeconds ? `${Math.floor(session.uptimeSeconds / 60)} mins` : 'Active'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VOUCHERS & INVENTORY */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search voucher code, PIN, batch ID..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#64748B]" />
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-xs font-medium text-[#172B4D] focus:outline-hidden"
                >
                  <option value="all">All Batches ({availableBatches.length})</option>
                  {availableBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-xs font-medium text-[#172B4D] focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available ({availableVouchers.length})</option>
                <option value="in_use">Active Online ({activeSessions.length})</option>
                <option value="used">Redeemed</option>
                <option value="revoked">Revoked</option>
              </select>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#123B5D] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Batch</span>
              </button>
            </div>
          </div>

          {filteredVouchers.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1976D2]">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-[#123B5D]">No Vouchers Found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                No vouchers match your current filters. Generate a new batch to replenish stock.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
                <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                  <thead className="bg-[#F5F8FC] text-[#64748B]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Voucher Code</th>
                      <th className="px-4 py-3 text-left font-semibold">PIN</th>
                      <th className="px-4 py-3 text-left font-semibold">Package Tier</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Batch ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                    {filteredVouchers.map((v) => {
                      const pkg = packages.find((p) => p.id === v.packageId);

                      return (
                        <tr key={v.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-[#123B5D] text-[13px]">
                              <span>{v.code}</span>
                              <button
                                onClick={() => handleCopyVoucherCode(v.code)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy Voucher Code"
                              >
                                {copiedVoucher === v.code ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-mono text-[#64748B]">{v.pin || '----'}</td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#123B5D]">{pkg?.name || 'Wi-Fi Pass'}</div>
                            <div className="text-[10px] text-[#64748B]">
                              {pkg ? `${pkg.downloadSpeedMbps}M down / ${pkg.uploadSpeedMbps}M up` : '5 Mbps'}
                            </div>
                          </td>

                          <td className="px-4 py-3 font-bold text-emerald-700">
                            {settings.currency} {v.priceKes}
                          </td>

                          <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">{v.batchId}</td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                v.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : v.status === 'in_use'
                                  ? 'bg-blue-100 text-blue-800'
                                  : v.status === 'revoked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  v.status === 'available'
                                    ? 'bg-emerald-500'
                                    : v.status === 'in_use'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-400'
                                }`}
                              ></span>
                              {v.status.toUpperCase()}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {v.status === 'available' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setVoucherCodeInput(v.code);
                                      setActiveTab('portal_preview');
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-[#1976D2] hover:bg-blue-100"
                                  >
                                    <span>Test in Portal</span>
                                  </button>
                                  <button
                                    onClick={() => revokeVoucher(v.id)}
                                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold px-1.5"
                                  >
                                    Revoke
                                  </button>
                                </>
                              )}
                              {v.status === 'in_use' && (
                                <button
                                  onClick={() => handleDisconnect(v.id, v.usedByMac)}
                                  className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                  <Power className="h-3 w-3" />
                                  <span>Kick</span>
                                </button>
                              )}
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
                {filteredVouchers.map((v) => {
                  const pkg = packages.find((p) => p.id === v.packageId);

                  return (
                    <div
                      key={v.id}
                      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#123B5D]">
                            <Ticket className="h-3.5 w-3.5 text-[#1976D2]" />
                            <span>{v.code}</span>
                          </div>
                          <div className="text-xs font-semibold text-[#172B4D] mt-0.5">
                            {pkg?.name || 'Wi-Fi Pass'}
                          </div>
                        </div>

                        <span className="font-bold text-sm text-emerald-700">
                          {settings.currency} {v.priceKes}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-slate-100">
                        <span className="font-mono text-[11px]">PIN: {v.pin || '----'}</span>
                        <span className="font-mono text-[11px]">{v.batchId}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            v.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'in_use'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {v.status.toUpperCase()}
                        </span>

                        <div className="flex items-center gap-2">
                          {v.status === 'available' && (
                            <button
                              onClick={() => {
                                setVoucherCodeInput(v.code);
                                setActiveTab('portal_preview');
                              }}
                              className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-[#1976D2]"
                            >
                              Test in Portal
                            </button>
                          )}
                          {v.status === 'in_use' && (
                            <button
                              onClick={() => handleDisconnect(v.id, v.usedByMac)}
                              className="rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700"
                            >
                              Kick
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAPTIVE PORTAL STUDIO & SIMULATOR */}
      {activeTab === 'portal_preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
          {/* Left Column: Branding, Gateway Config & Quick Vouchers */}
          <div className="lg:col-span-7 space-y-4">
            {/* Card 1: Captive Portal Configuration */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#1976D2]" />
                  Captive Portal Identity & CNA Triggers
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  DNS Captive Trap Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">Broadcast Wi-Fi SSID</label>
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2.5 font-bold text-[#123B5D] flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-[#1976D2]" />
                    <span>{settings.companyName} Free Wi-Fi</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">Portal Gateway Domain & IP</label>
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2.5 font-mono text-[#123B5D] flex items-center justify-between">
                    <span>wifi.login</span>
                    <span className="text-[#64748B]">10.50.0.1</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">Simulated Client MAC Address</label>
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2.5 font-mono font-bold text-[#1976D2]">
                    {clientMac}
                  </div>
                </div>

                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">Support Hotline & Assistance</label>
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2.5 text-[#172B4D] font-mono">
                    {settings.supportPhone}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B] leading-relaxed pt-1">
                When a smartphone, tablet, or laptop joins your access points, the device's Captive Network Assistant (CNA) issues an HTTP probe and automatically renders this branded portal without requiring the user to type a URL.
              </p>
            </div>

            {/* Card 2: Quick-Test Available Vouchers List */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-[#123B5D] flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-[#1976D2]" />
                  <span>Click an In-Stock Voucher to Auto-Fill & Test:</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1976D2]">
                  {availableVouchers.length} Ready
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableVouchers.slice(0, 8).map((v) => {
                  const pkg = packages.find((p) => p.id === v.packageId);
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVoucherCodeInput(v.code)}
                      className="rounded-xl bg-white border border-blue-200 p-2.5 text-left hover:border-[#1976D2] hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="font-mono font-bold text-xs text-[#123B5D] group-hover:text-[#1976D2]">
                        {v.code}
                      </div>
                      <div className="text-[10px] text-[#64748B] truncate mt-0.5">{pkg?.name || 'Wi-Fi Pass'}</div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-1">
                        {settings.currency} {v.priceKes}
                      </div>
                    </button>
                  );
                })}
                {availableVouchers.length === 0 && (
                  <div className="col-span-4 text-xs text-[#64748B] italic py-2">
                    No available vouchers in inventory. Click "+ Generate Vouchers" in the header to create a batch!
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Walled Garden Rules */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Pre-Authentication Walled Garden Whitelist
              </h3>
              <p className="text-xs text-[#64748B]">
                These domains and IP ranges are accessible to guests before purchasing or entering a voucher:
              </p>
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                {['*safaricom.co.ke', '*stripe.com', 'captive.apple.com', 'connectivitycheck.gstatic.com', '10.50.0.1'].map((domain) => (
                  <span key={domain} className="rounded-md bg-[#F5F8FC] border border-[#E2E8F0] px-2.5 py-1 text-[#123B5D]">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Interactive Smartphone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[44px] border-[10px] border-[#0B2A43] bg-white p-3.5 shadow-2xl space-y-3">
              {/* Phone Dynamic Island & Camera Notch */}
              <div className="mx-auto h-4 w-28 rounded-full bg-[#0B2A43] mb-1"></div>

              {/* CNA Browser Bar */}
              <div className="rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] px-3 py-1.5 flex items-center justify-between text-[11px] text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span className="font-mono text-[#123B5D] font-bold">wifi.login</span>
                </div>
                <span className="text-[10px]">CNA Assistant</span>
              </div>

              {/* Portal Content Screen */}
              <div className="space-y-4 pt-1">
                {/* Brand Header */}
                <div className="text-center pt-2 pb-3 border-b border-[#E2E8F0]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#123B5D] text-[#00B8D9] font-black text-base mb-1.5 shadow-xs">
                    Wi-Fi
                  </div>
                  <h4 className="text-sm font-bold text-[#123B5D]">{settings.companyName}</h4>
                  <p className="text-[11px] text-[#64748B]">High-Speed Guest Wi-Fi Zone</p>
                </div>

                {/* Feedback Message */}
                {portalMsg && (
                  <div
                    className={`rounded-xl p-3 text-xs font-semibold animate-in fade-in ${
                      portalMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {portalMsg.text}
                  </div>
                )}

                {/* IF CONNECTED: Active Session Screen with live data counter & Disconnect */}
                {clientCurrentSession ? (
                  <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="font-bold text-emerald-900 text-sm">Internet Active</span>
                      </div>
                      <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 uppercase">
                        ONLINE
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-emerald-200 pt-2 text-[#172B4D]">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Active Code:</span>
                        <span className="font-mono font-bold text-[#123B5D]">{clientCurrentSession.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Assigned IP:</span>
                        <span className="font-mono text-[#123B5D]">{clientCurrentSession.ipAddress || '10.50.0.124'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Device MAC:</span>
                        <span className="font-mono text-[#123B5D]">{clientMac}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Data Meter:</span>
                        <span className="font-bold text-emerald-800">
                          {((clientCurrentSession.bytesIn || 342000000) / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        disconnectHotspotSession(clientCurrentSession.id);
                        setPortalMsg({ type: 'success', text: 'You have disconnected from Wi-Fi access.' });
                      }}
                      className="w-full rounded-xl bg-rose-600 py-2.5 font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Disconnect & Log Out
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Segmented Payment Mode Selector */}
                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#F5F8FC] p-1 border border-[#E2E8F0] text-[10px] font-bold text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPortalPayMode('stk');
                          setPortalMsg(null);
                        }}
                        className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                          portalPayMode === 'stk'
                            ? 'bg-[#1976D2] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                        }`}
                      >
                        STK Push
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortalPayMode('paybill');
                          setPortalMsg(null);
                        }}
                        className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                          portalPayMode === 'paybill'
                            ? 'bg-[#1976D2] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                        }`}
                      >
                        Paybill C2B
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortalPayMode('voucher');
                          setPortalMsg(null);
                        }}
                        className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                          portalPayMode === 'voucher'
                            ? 'bg-[#1976D2] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#172B4D]'
                        }`}
                      >
                        Voucher
                      </button>
                    </div>

                    {/* MODE 1: M-PESA STK PUSH (Lipa na M-Pesa Online) */}
                    {portalPayMode === 'stk' && (
                      <div className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                            <CreditCard className="h-4 w-4 text-emerald-700" /> M-Pesa STK Online
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Instant PIN Prompt
                          </span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Select Wi-Fi Pass:</label>
                          <select
                            value={selectedPackageId}
                            onChange={(e) => setSelectedPackageId(e.target.value)}
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-semibold text-[#172B4D] focus:outline-hidden"
                          >
                            {packages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.downloadSpeedMbps}M/{p.uploadSpeedMbps}M) - {settings.currency} {p.priceKes}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Safaricom Phone Number:
                          </label>
                          <input
                            type="text"
                            value={portalPhoneInput}
                            onChange={(e) => setPortalPhoneInput(e.target.value)}
                            placeholder={settings.currency === 'KES' ? '0712345678 or 254...' : '+1 555-0199'}
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 font-mono text-center text-xs font-semibold focus:outline-hidden"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isBuying}
                          onClick={handleTriggerStkPrompt}
                          className="w-full rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          {isBuying ? 'Awaiting M-Pesa Callback...' : `Send STK Prompt (${settings.currency} ${packages.find(p => p.id === selectedPackageId)?.priceKes || 3})`}
                        </button>
                      </div>
                    )}

                    {/* MODE 2: SAFARICOM PAYBILL C2B MANUAL VERIFICATION */}
                    {portalPayMode === 'paybill' && (
                      <form onSubmit={handlePortalPaybillVerify} className="space-y-2.5 rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                            <Radio className="h-4 w-4 text-[#1976D2]" /> M-Pesa Paybill C2B
                          </span>
                          <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                            {settings.mpesaShortcode}
                          </span>
                        </div>

                        <div className="rounded-lg bg-white border border-blue-200 p-2 text-[10px] space-y-1 text-[#172B4D]">
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Business No:</span>
                            <span className="font-mono font-bold text-[#123B5D]">{settings.mpesaShortcode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Account No:</span>
                            <span className="font-mono font-bold text-[#1976D2]">HOTSPOT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Amount:</span>
                            <span className="font-bold text-emerald-700">
                              {settings.currency} {packages.find(p => p.id === selectedPackageId)?.priceKes || 3}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">Select Pass Plan:</label>
                          <select
                            value={selectedPackageId}
                            onChange={(e) => setSelectedPackageId(e.target.value)}
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-semibold text-[#172B4D] focus:outline-hidden"
                          >
                            {packages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} - {settings.currency} {p.priceKes}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">M-Pesa SMS Receipt Code:</label>
                          <input
                            type="text"
                            value={portalPaybillReceipt}
                            onChange={(e) => setPortalPaybillReceipt(e.target.value.toUpperCase())}
                            placeholder="e.g. QKH718293A"
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 font-mono text-center text-xs font-bold uppercase focus:outline-hidden"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isBuying}
                          className="w-full rounded-xl bg-[#123B5D] py-2.5 font-bold text-white hover:bg-[#0B2A43] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          {isBuying ? 'Verifying Receipt...' : 'Verify Code & Connect'}
                        </button>
                      </form>
                    )}

                    {/* MODE 3: VOUCHER PIN LOGIN */}
                    {portalPayMode === 'voucher' && (
                      <form onSubmit={handlePortalVoucherLogin} className="space-y-2 rounded-2xl bg-[#F5F8FC] p-3.5 text-xs border border-[#E2E8F0] animate-in fade-in">
                        <span className="font-bold text-[#123B5D] flex items-center gap-1.5 text-xs">
                          <Ticket className="h-4 w-4 text-[#1976D2]" /> Have a Wi-Fi Voucher?
                        </span>
                        <input
                          type="text"
                          value={voucherCodeInput}
                          onChange={(e) => setVoucherCodeInput(e.target.value)}
                          placeholder="Enter Code (e.g. WIFI-9481)"
                          className="w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 font-mono text-center text-xs font-bold uppercase focus:border-[#1976D2] focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-[#123B5D] py-2.5 font-bold text-white hover:bg-[#0B2A43] transition-colors shadow-xs cursor-pointer"
                        >
                          Connect to Wi-Fi
                        </button>
                      </form>
                    )}

                    {/* Realistic Safaricom STK PIN Prompt Simulation Modal Overlay */}
                    {stkPromptOpen && (
                      <div className="rounded-2xl border-2 border-emerald-500 bg-[#0B2A43] p-3 text-white space-y-2.5 shadow-xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-emerald-500/40 pb-1.5">
                          <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                            SIM Toolkit: Lipa na M-PESA
                          </span>
                          <button
                            type="button"
                            onClick={() => setStkPromptOpen(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-200 leading-snug">
                          Pay <span className="font-bold text-emerald-400">{settings.currency} {packages.find(p => p.id === selectedPackageId)?.priceKes || 3}</span> to <span className="font-bold text-white">{settings.companyName.toUpperCase()} HOTSPOT</span> (Acc: <span className="font-mono text-emerald-300">WIFI-GUEST</span>)?
                        </p>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 block">Enter M-Pesa PIN:</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={stkPinInput}
                            onChange={(e) => setStkPinInput(e.target.value)}
                            className="w-full rounded-lg bg-white/10 border border-emerald-500/50 p-2 font-mono text-center text-emerald-300 text-sm tracking-widest focus:outline-hidden"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setStkPromptOpen(false)}
                            className="rounded-lg border border-slate-600 bg-transparent py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/5"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmStkPush}
                            className="rounded-lg bg-emerald-500 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 shadow-xs cursor-pointer"
                          >
                            Authorize PIN
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Portal Footer */}
                <div className="text-center text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                  <p>Support Hotline: {settings.supportPhone}</p>
                  <p className="mt-0.5">Powered by {settings.companyName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTEROS SCRIPT */}
      {activeTab === 'routeros_script' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Explanation cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-[#1976D2]" />
                1. Hotspot Interface Binding
              </span>
              <p className="text-[11px] text-[#64748B]">
                Attaches to interface wlan1 with captive trap DNS redirect on 10.50.0.1.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                2. RADIUS RFC 3576 CoA
              </span>
              <p className="text-[11px] text-[#64748B]">
                Enables incoming CoA listener on port 3799 for real-time session kick.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-blue-600" />
                3. Walled Garden White-list
              </span>
              <p className="text-[11px] text-[#64748B]">
                Permits traffic to payment gateways and iOS/Android captive checks pre-login.
              </p>
            </div>
          </div>

          {/* Script Terminal Container */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">
                  MikroTik RouterOS v7 Hotspot & RADIUS Script (.rsc)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Paste directly into your MikroTik terminal (`/terminal`) to provision the Hotspot server.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC] shadow-2xs"
                >
                  {copiedScript ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-[#64748B]" />}
                  <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-bold text-white hover:bg-[#123B5D] transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download .rsc</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-[#0B2A43] p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[450px]">
              <pre>{routerOsScript}</pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Generate Voucher Batch */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[#1976D2]" />
                Generate Vouchers Batch
              </h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-[#64748B] hover:text-[#172B4D]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Select Internet Package *</label>
                <select
                  required
                  value={batchPackageId}
                  onChange={(e) => setBatchPackageId(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {settings.currency} {p.priceKes} ({p.serviceType.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Quantity (Cards)</label>
                  <select
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  >
                    <option value={10}>10 Vouchers</option>
                    <option value={25}>25 Vouchers</option>
                    <option value={50}>50 Vouchers</option>
                    <option value={100}>100 Vouchers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Voucher Prefix</label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                    placeholder="WIFI"
                    className="w-full rounded-xl border border-[#E2E8F0] p-2.5 font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] transition-colors"
                >
                  Generate Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable Voucher Cards Sheet */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 print:hidden">
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">Printable Hotspot Vouchers Sheet (A4 Grid)</h3>
                <p className="text-xs text-[#64748B]">
                  Perforated cards ready for counter sales, cybercafes, and reseller agents.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1976D2] px-4 py-2 text-xs font-bold text-white hover:bg-[#123B5D]"
                >
                  <Printer className="h-4 w-4" />
                  <span>Send to Printer</span>
                </button>
                <button onClick={() => setIsPrintModalOpen(false)} className="text-[#64748B] hover:text-[#172B4D]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3">
              {vouchers.slice(0, 18).map((v) => {
                const pkg = packages.find((p) => p.id === v.packageId);
                return (
                  <div
                    key={v.id}
                    className="border-2 border-dashed border-[#123B5D]/40 rounded-2xl p-3.5 bg-white space-y-2 text-center"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px]">
                      <span className="font-bold text-[#123B5D]">{settings.companyName}</span>
                      <span className="font-bold text-emerald-700">{settings.currency} {v.priceKes}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                        {pkg?.name || 'Wi-Fi Pass'}
                      </span>
                      <div className="font-mono text-base font-black text-[#123B5D] tracking-wider my-1">
                        {v.code}
                      </div>
                      {v.pin && <div className="font-mono text-[11px] text-[#64748B]">PIN: {v.pin}</div>}
                    </div>

                    <div className="text-[9px] text-[#64748B] border-t border-slate-100 pt-1">
                      Connect to Wi-Fi &bull; Open Browser &bull; Enter Code
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
