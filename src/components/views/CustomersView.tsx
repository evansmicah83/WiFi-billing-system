import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Home,
  Wifi,
  Network,
  CreditCard,
  Trash2,
  Power,
  Edit,
  X,
  Download,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Building,
  Radio,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { Customer, ServiceType, ConnectionMedium } from '../../types';

export const CustomersView: React.FC = () => {
  const {
    customers,
    packages,
    routers,
    sites,
    settings,
    addCustomer,
    toggleCustomerStatus,
    deleteCustomer,
    initiateMpesaStkPush,
  } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaSuccessMsg, setMpesaSuccessMsg] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Add form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+1');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('pppoe');
  const [connectionMedium, setConnectionMedium] = useState<ConnectionMedium>('fiber');
  const [cpeModel, setCpeModel] = useState('');
  const [wirelessSignalDbm, setWirelessSignalDbm] = useState('');
  const [packageId, setPackageId] = useState(packages[0]?.id || '');
  const [routerId, setRouterId] = useState(routers[0]?.id || '');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [estateBuilding, setEstateBuilding] = useState('');
  const [houseRoomNo, setHouseRoomNo] = useState('');
  const [pppoeUsername, setPppoeUsername] = useState('');
  const [pppoePassword, setPppoePassword] = useState('');
  const [onuSerialNumber, setOnuSerialNumber] = useState('');

  // Derived metrics
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const suspendedCustomers = customers.filter((c) => c.status === 'suspended');
  const pppoeCustomers = customers.filter((c) => c.serviceType === 'pppoe');
  const hotspotCustomers = customers.filter((c) => c.serviceType === 'hotspot');

  const estimatedMrr = customers.reduce((sum, c) => {
    if (c.status === 'active') {
      const pkg = packages.find((p) => p.id === c.packageId);
      return sum + (pkg?.priceKes || 2500);
    }
    return sum;
  }, 0);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.pppoeUsername && c.pppoeUsername.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || c.serviceType === filterType;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCopyAccount = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    const headers = [
      'Account Number',
      'Full Name',
      'Phone',
      'Service Type',
      'Package',
      'Status',
      'PPPoE Username',
      'Estate/Building',
      'House/Room',
      'ONU Serial',
      'Expires At',
    ];
    const rows = customers.map((c) => {
      const pkg = packages.find((p) => p.id === c.packageId);
      return [
        c.accountNumber,
        c.fullName,
        c.phone,
        c.serviceType,
        pkg?.name || 'Standard Plan',
        c.status,
        c.pppoeUsername || '',
        c.estateBuilding || '',
        c.houseRoomNo || '',
        c.onuSerialNumber || '',
        c.expiresAt || '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartlinknet_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const generatedUsername = pppoeUsername.trim() || phone.replace(/\D/g, '');
    const generatedPassword = pppoePassword.trim() || Math.random().toString(36).slice(-6);

    addCustomer({
      tenantId: settings.tenantId,
      siteId: siteId || (sites[0]?.id ?? 'site_default'),
      routerId: routerId || (routers[0]?.id ?? 'rt_default'),
      fullName,
      phone,
      email,
      serviceType,
      connectionMedium,
      cpeModel: cpeModel.trim() || undefined,
      wirelessSignalDbm: wirelessSignalDbm ? Number(wirelessSignalDbm) : undefined,
      packageId: packageId || (packages[0]?.id ?? 'pkg_default'),
      status: 'active',
      pppoeUsername: serviceType === 'pppoe' ? generatedUsername : undefined,
      pppoePassword: serviceType === 'pppoe' ? generatedPassword : undefined,
      physicalAddress: physicalAddress || 'Main District',
      estateBuilding,
      houseRoomNo,
      onuSerialNumber,
      autoRenew: true,
      expiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    });

    setIsAddModalOpen(false);
    // Reset form
    setFullName('');
    setPhone('+1');
    setEmail('');
    setConnectionMedium('fiber');
    setCpeModel('');
    setWirelessSignalDbm('');
    setPhysicalAddress('');
    setEstateBuilding('');
    setHouseRoomNo('');
    setPppoeUsername('');
    setPppoePassword('');
    setOnuSerialNumber('');
  };

  const handlePayMpesa = async () => {
    if (!payingCustomer) return;
    const pkg = packages.find((p) => p.id === payingCustomer.packageId);
    const amount = pkg?.priceKes || 2500;

    setIsProcessingMpesa(true);
    setMpesaSuccessMsg('');
    try {
      const res = await initiateMpesaStkPush(
        mpesaPhone || payingCustomer.phone,
        amount,
        `Internet Renewal - ${payingCustomer.accountNumber}`,
        payingCustomer.id,
        pkg?.id
      );
      setMpesaSuccessMsg(`STK Push confirmed! M-Pesa Receipt: ${res.mpesaReceiptNumber}`);
      setTimeout(() => {
        setPayingCustomer(null);
        setMpesaSuccessMsg('');
      }, 2000);
    } catch {
      setMpesaSuccessMsg('Error: Could not initiate STK push. Check customer phone number.');
    } finally {
      setIsProcessingMpesa(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Broadband, Wireless & Hotspot Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage broadband subscribers across Fiber (GPON), Fixed Wireless (FWA), Ethernet LAN, and Wi-Fi Hotspot networks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {customers.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC]"
            >
              <Download className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Register Subscriber</span>
          </button>
        </div>
      </div>

      {/* Splynx-Grade Executive KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total Subscribers</span>
            <Users className="h-4 w-4 text-[#1976D2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">{customers.length}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-emerald-600">{activeCustomers.length} Active</span>
            <span className="text-[#64748B]">&bull;</span>
            <span className="text-rose-600">{suspendedCustomers.length} Suspended</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>PPPoE Broadband Clients</span>
            <Network className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">{pppoeCustomers.length}</div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            FreeRADIUS AAA Authentication
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Hotspot Accounts</span>
            <Wifi className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">{hotspotCustomers.length}</div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            Captive Portal & Voucher Bindings
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Estimated MRR</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {settings.currency} {estimatedMrr.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Monthly Recurring Revenue
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Status Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#1976D2] text-white shadow-2xs'
                : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]'
            }`}
          >
            Active ({activeCustomers.length})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              statusFilter === 'suspended'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]'
            }`}
          >
            Suspended ({suspendedCustomers.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, account no, PPPoE username..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#64748B]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
            >
              <option value="all">All Service Types</option>
              <option value="pppoe">PPPoE Only</option>
              <option value="hotspot">Hotspot Only</option>
              <option value="corporate_dedicated">Corporate Leased</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List Table / Empty State */}
      {filteredCustomers.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#123B5D]">
            {customers.length === 0 ? 'No subscribers registered yet' : 'No matching subscribers found'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {customers.length === 0
              ? 'This system starts with zero demo data. Click below to add your first PPPoE residential customer or Hotspot subscriber.'
              : 'Try adjusting your search keywords or filter criteria.'}
          </p>
          {customers.length === 0 && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Subscriber</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Account / Subscriber</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact & Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Service & Package</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Expiry Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredCustomers.map((cust) => {
                  const pkg = packages.find((p) => p.id === cust.packageId);
                  const isSuspended = cust.status === 'suspended';

                  return (
                    <tr key={cust.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-[#1976D2] text-xs shrink-0">
                            {cust.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => setViewingCustomer(cust)}
                              className="font-bold text-[#123B5D] hover:text-[#1976D2] text-left hover:underline flex items-center gap-1"
                            >
                              <span>{cust.fullName}</span>
                              <Eye className="h-3 w-3 text-[#64748B]" />
                            </button>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-[#64748B]">
                              <span>{cust.accountNumber}</span>
                              <button
                                onClick={() => handleCopyAccount(cust.accountNumber)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy Account No"
                              >
                                {copiedAccount === cust.accountNumber ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {cust.pppoeUsername && (
                              <div className="font-mono text-[10px] text-[#1976D2]">
                                PPPoE: {cust.pppoeUsername}
                              </div>
                            )}
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  cust.connectionMedium === 'wireless'
                                    ? 'bg-amber-100 text-amber-800'
                                    : cust.connectionMedium === 'ethernet'
                                    ? 'bg-purple-100 text-purple-800'
                                    : cust.connectionMedium === 'hotspot'
                                    ? 'bg-cyan-100 text-cyan-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {cust.connectionMedium === 'wireless' ? (
                                  <>
                                    <Radio className="h-2.5 w-2.5" />
                                    <span>Wireless FWA</span>
                                    {cust.wirelessSignalDbm && (
                                      <span className="font-mono text-[8px] text-amber-900 font-bold">
                                        ({cust.wirelessSignalDbm} dBm)
                                      </span>
                                    )}
                                  </>
                                ) : cust.connectionMedium === 'ethernet' ? (
                                  <>
                                    <Network className="h-2.5 w-2.5" />
                                    <span>Ethernet LAN</span>
                                  </>
                                ) : cust.connectionMedium === 'hotspot' ? (
                                  <>
                                    <Wifi className="h-2.5 w-2.5" />
                                    <span>Hotspot</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-2.5 w-2.5" />
                                    <span>Fiber GPON</span>
                                  </>
                                )}
                              </span>
                              {cust.cpeModel && (
                                <span className="text-[10px] text-[#64748B] truncate max-w-[120px]" title={cust.cpeModel}>
                                  {cust.cpeModel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-medium">
                          <Phone className="h-3 w-3 text-[#64748B]" /> {cust.phone}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5">
                          <Home className="h-3 w-3 text-[#64748B]" />
                          {cust.estateBuilding
                            ? `${cust.estateBuilding}, Rm ${cust.houseRoomNo || 'N/A'}`
                            : cust.physicalAddress}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#123B5D]">
                          {pkg?.name || 'Default Residential Plan'}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {pkg ? `${pkg.downloadSpeedMbps}M down / ${pkg.uploadSpeedMbps}M up` : '10 Mbps'}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-700">
                          {settings.currency} {pkg?.priceKes || 25}/mo
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cust.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cust.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cust.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          {cust.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[#64748B]">
                        {cust.expiresAt ? (
                          <div>
                            <div>{new Date(cust.expiresAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-[#64748B]">
                              {new Date(cust.expiresAt) > new Date() ? 'Active Term' : 'Overdue'}
                            </div>
                          </div>
                        ) : (
                          'Open Term'
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPayingCustomer(cust);
                              setMpesaPhone(cust.phone);
                            }}
                            className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            title="Renew with M-Pesa STK Push"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>M-Pesa</span>
                          </button>

                          <button
                            onClick={() => toggleCustomerStatus(cust.id)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                            title={isSuspended ? 'Restore Service (CoA)' : 'Suspend Service (CoA Disconnect)'}
                          >
                            <Power className="h-3 w-3" />
                            <span>{isSuspended ? 'Restore' : 'Suspend'}</span>
                          </button>

                          <button
                            onClick={() => deleteCustomer(cust.id)}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                            title="Delete Customer"
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

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((cust) => {
              const pkg = packages.find((p) => p.id === cust.packageId);
              const isSuspended = cust.status === 'suspended';

              return (
                <div
                  key={cust.id}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#123B5D] text-sm">{cust.fullName}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono mt-0.5">
                        <span>{cust.accountNumber}</span>
                        <button
                          onClick={() => handleCopyAccount(cust.accountNumber)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedAccount === cust.accountNumber ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        cust.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cust.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] bg-[#F5F8FC] p-2.5 rounded-lg">
                    <div>
                      <span className="block text-[10px] text-slate-400">Phone</span>
                      <span className="font-medium text-[#172B4D]">{cust.phone}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Plan</span>
                      <span className="font-medium text-[#172B4D]">
                        {pkg?.name || 'Standard'} ({settings.currency} {pkg?.priceKes || 25})
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Medium / Access</span>
                      <span className="font-medium uppercase text-[#172B4D] text-[11px]">
                        {cust.connectionMedium || 'Fiber'} {cust.wirelessSignalDbm ? `(${cust.wirelessSignalDbm} dBm)` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Expiry</span>
                      <span className="font-medium text-[#172B4D]">
                        {cust.expiresAt ? new Date(cust.expiresAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setViewingCustomer(cust)}
                      className="text-xs font-semibold text-[#1976D2] hover:underline"
                    >
                      View Profile
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPayingCustomer(cust);
                          setMpesaPhone(cust.phone);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Renew</span>
                      </button>

                      <button
                        onClick={() => toggleCustomerStatus(cust.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          isSuspended
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isSuspended ? 'Restore' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Subscriber */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#123B5D]">Register New Subscriber</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-[#172B4D]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Full Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samuel Vance"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0144 or 254..."
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Access Technology / Medium *</label>
                  <select
                    value={connectionMedium}
                    onChange={(e) => setConnectionMedium(e.target.value as ConnectionMedium)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="fiber">Fiber Optic (GPON / FTTH / EPON)</option>
                    <option value="wireless">Fixed Wireless (PtMP / Ubiquiti / MikroTik / Cambium)</option>
                    <option value="ethernet">Direct Ethernet LAN (Cat6 Switch)</option>
                    <option value="hotspot">Wi-Fi Hotspot</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="pppoe">PPPoE Broadband Client</option>
                    <option value="hotspot">Hotspot Fixed Subscriber</option>
                    <option value="corporate_dedicated">Corporate Dedicated Leased</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Internet Package</label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    {packages.length === 0 ? (
                      <option value="">Default Plan</option>
                    ) : (
                      packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.downloadSpeedMbps}M/{pkg.uploadSpeedMbps}M) - {settings.currency} {pkg.priceKes}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">CPE / Radio / ONT Hardware Model</label>
                  <input
                    type="text"
                    value={cpeModel}
                    onChange={(e) => setCpeModel(e.target.value)}
                    placeholder="e.g. Ubiquiti LiteBeam 5AC or Huawei HG8546M"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                {connectionMedium === 'wireless' && (
                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Wireless Signal Strength (dBm)</label>
                    <input
                      type="number"
                      value={wirelessSignalDbm}
                      onChange={(e) => setWirelessSignalDbm(e.target.value)}
                      placeholder="e.g. -58"
                      className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-mono"
                    />
                  </div>
                )}

                {serviceType === 'pppoe' && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#172B4D] mb-1">PPPoE Username</label>
                      <input
                        type="text"
                        value={pppoeUsername}
                        onChange={(e) => setPppoeUsername(e.target.value)}
                        placeholder="Leave blank to use phone number"
                        className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#172B4D] mb-1">PPPoE Password</label>
                      <input
                        type="text"
                        value={pppoePassword}
                        onChange={(e) => setPppoePassword(e.target.value)}
                        placeholder="Leave blank to auto-generate"
                        className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Estate / Building / Complex</label>
                  <input
                    type="text"
                    value={estateBuilding}
                    onChange={(e) => setEstateBuilding(e.target.value)}
                    placeholder="e.g. Diamond Court, Block B"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">House / Room / Office No</label>
                  <input
                    type="text"
                    value={houseRoomNo}
                    onChange={(e) => setHouseRoomNo(e.target.value)}
                    placeholder="e.g. B4"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Physical Area / Town</label>
                  <input
                    type="text"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    placeholder="e.g. 104 Market Street, Suite 4B"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">CPE / ONU / Radio Serial or MAC</label>
                  <input
                    type="text"
                    value={onuSerialNumber}
                    onChange={(e) => setOnuSerialNumber(e.target.value)}
                    placeholder="e.g. UB-LBE-9941 or HWTC1A2B3C"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-semibold text-white hover:bg-[#123B5D]"
                >
                  Save Subscriber & Provision FreeRADIUS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Customer Technical Details */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1976D2]" />
                Subscriber Profile
              </h3>
              <button onClick={() => setViewingCustomer(null)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-[#F5F8FC] p-3 rounded-lg">
                <div>
                  <div className="text-base font-bold text-[#123B5D]">{viewingCustomer.fullName}</div>
                  <div className="font-mono text-[#64748B]">{viewingCustomer.accountNumber}</div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    viewingCustomer.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {viewingCustomer.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block">Service Type</span>
                  <span className="font-bold text-[#123B5D] uppercase">{viewingCustomer.serviceType}</span>
                </div>
                <div className="p-3 border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block">Assigned Package</span>
                  <span className="font-bold text-[#123B5D]">
                    {packages.find((p) => p.id === viewingCustomer.packageId)?.name || 'Standard Plan'}
                  </span>
                </div>
                <div className="p-3 border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block">Contact Phone</span>
                  <span className="font-mono font-bold text-[#123B5D]">{viewingCustomer.phone}</span>
                </div>
                <div className="p-3 border border-[#E2E8F0] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block">Subscription Expiry</span>
                  <span className="font-bold text-[#123B5D]">
                    {viewingCustomer.expiresAt
                      ? new Date(viewingCustomer.expiresAt).toLocaleDateString()
                      : 'Open Term'}
                  </span>
                </div>
              </div>

              {viewingCustomer.serviceType === 'pppoe' && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5">
                  <span className="font-bold text-blue-900 block">FreeRADIUS Credentials</span>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Username:</span>
                    <span className="font-mono font-bold text-blue-950">{viewingCustomer.pppoeUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Password:</span>
                    <span className="font-mono font-bold text-blue-950">{viewingCustomer.pppoePassword || '••••••••'}</span>
                  </div>
                </div>
              )}

              <div className="p-3 border border-[#E2E8F0] rounded-lg space-y-2">
                <span className="text-[10px] text-[#64748B] block uppercase font-bold tracking-wider">Access Medium & Hardware Equipment</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Access Medium</span>
                    <span className="font-bold text-[#123B5D] uppercase">
                      {viewingCustomer.connectionMedium || 'Fiber GPON'}
                    </span>
                  </div>
                  {viewingCustomer.wirelessSignalDbm && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Wireless Signal</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {viewingCustomer.wirelessSignalDbm} dBm
                      </span>
                    </div>
                  )}
                  {viewingCustomer.cpeModel && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">CPE / Radio Model</span>
                      <span className="font-medium text-[#172B4D]">{viewingCustomer.cpeModel}</span>
                    </div>
                  )}
                  {viewingCustomer.onuSerialNumber && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hardware S/N or MAC</span>
                      <span className="font-mono text-[#1976D2]">{viewingCustomer.onuSerialNumber}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#172B4D]">
                  <span className="text-[10px] text-slate-400 block">Address / Location:</span>
                  {viewingCustomer.estateBuilding
                    ? `${viewingCustomer.estateBuilding}, Room ${viewingCustomer.houseRoomNo || 'N/A'}`
                    : viewingCustomer.physicalAddress}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#172B4D]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Trigger M-Pesa STK Push */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Safaricom M-Pesa STK Push
              </h3>
              <button onClick={() => setPayingCustomer(null)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-[#F5F8FC] p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Subscriber:</span>
                <span className="font-bold text-[#123B5D]">{payingCustomer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Account:</span>
                <span className="font-mono text-[#172B4D]">{payingCustomer.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Amount to Charge:</span>
                <span className="font-bold text-emerald-600">
                  KES {packages.find((p) => p.id === payingCustomer.packageId)?.priceKes || 2500}
                </span>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-[#172B4D] mb-1">
                Customer M-Pesa Phone Number
              </label>
              <input
                type="text"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
                className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-sm focus:border-emerald-600 focus:outline-hidden"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                The subscriber will receive a prompt on their phone to enter their M-Pesa PIN.
              </p>
            </div>

            {mpesaSuccessMsg && (
              <div className="rounded-lg bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                {mpesaSuccessMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingCustomer(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#172B4D]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isProcessingMpesa}
                onClick={handlePayMpesa}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isProcessingMpesa ? 'Sending STK Push...' : 'Send STK Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
