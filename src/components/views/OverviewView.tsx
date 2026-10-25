import React, { useState } from 'react';
import {
  Users,
  Router,
  Wifi,
  Network,
  CreditCard,
  ShieldCheck,
  PlusCircle,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Activity,
  AlertTriangle,
  Building,
  CheckCircle2,
  Ticket,
  Layers,
  Clock,
  ArrowDownRight,
  DollarSign,
  Download,
  Calendar,
  Filter,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface OverviewViewProps {
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const {
    customers,
    routers,
    vouchers,
    payments,
    invoices,
    sites,
    upstreamConnections,
    settings,
  } = useISP();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'bandwidth' | 'subscribers'>('revenue');

  // Calculations
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amountKes, 0);

  // Today's payments
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayRevenue = completedPayments
    .filter((p) => p.createdAt.startsWith(todayDateStr))
    .reduce((sum, p) => sum + p.amountKes, 0);

  // Unpaid invoices
  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');
  const totalOutstandingKes = unpaidInvoices.reduce((sum, i) => sum + i.amountKes, 0);

  // Subscribers
  const activeSubscribers = customers.filter((c) => c.status === 'active').length;
  const suspendedSubscribers = customers.filter((c) => c.status === 'suspended').length;
  const pppoeCount = customers.filter((c) => c.serviceType === 'pppoe').length;
  const hotspotCount = customers.filter((c) => c.serviceType === 'hotspot').length;
  const onlineRouters = routers.filter((r) => r.status === 'online').length;
  const activeVouchers = vouchers.filter((v) => v.status === 'in_use').length;

  // ARPU (Average Revenue Per User)
  const arpuKes = activeSubscribers > 0 ? Math.round(totalRevenue / activeSubscribers) : 0;

  // Revenue chart data (days of month)
  const revenueChartData = [
    { day: 'Day 1', revenue: Math.round(totalRevenue * 0.1) },
    { day: 'Day 5', revenue: Math.round(totalRevenue * 0.25) },
    { day: 'Day 10', revenue: Math.round(totalRevenue * 0.45) },
    { day: 'Day 15', revenue: Math.round(totalRevenue * 0.65) },
    { day: 'Day 20', revenue: Math.round(totalRevenue * 0.85) },
    { day: 'Today', revenue: totalRevenue },
  ];

  // Bandwidth chart data (24 hour distribution in Mbps)
  const bandwidthChartData = [
    { time: '00:00', downloadMbps: onlineRouters > 0 ? 12 : 0, uploadMbps: onlineRouters > 0 ? 5 : 0 },
    { time: '04:00', downloadMbps: onlineRouters > 0 ? 8 : 0, uploadMbps: onlineRouters > 0 ? 3 : 0 },
    { time: '08:00', downloadMbps: onlineRouters > 0 ? 45 : 0, uploadMbps: onlineRouters > 0 ? 22 : 0 },
    { time: '12:00', downloadMbps: onlineRouters > 0 ? 68 : 0, uploadMbps: onlineRouters > 0 ? 35 : 0 },
    { time: '16:00', downloadMbps: onlineRouters > 0 ? 84 : 0, uploadMbps: onlineRouters > 0 ? 48 : 0 },
    { time: '20:00', downloadMbps: onlineRouters > 0 ? 120 : 0, uploadMbps: onlineRouters > 0 ? 62 : 0 },
    { time: '23:00', downloadMbps: onlineRouters > 0 ? 55 : 0, uploadMbps: onlineRouters > 0 ? 28 : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header: System Status & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
              Executive Billing & Network Overview
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
              LIVE POP &bull; {settings.countyCity || 'ACTIVE'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time collections, subscriber accounting, FreeRADIUS AAA status, and MikroTik CGNAT remote management.
          </p>
        </div>

        {/* Quick ISP Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('payments')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            <span>Payment Prompt</span>
          </button>
          <button
            onClick={() => onNavigate('connect_mikrotik')}
            className="flex items-center gap-1.5 rounded-xl bg-[#1976D2] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Zap className="h-4 w-4 text-[#00B8D9]" />
            <span>Connect MikroTik</span>
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs font-bold text-[#172B4D] hover:bg-[#F5F8FC] transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-[#1976D2]" />
            <span>+ Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards (Splynx / Sonar style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Collections (MTD)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#123B5D]">
              {settings.currency} {totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Reconciled
            </span>
            <span>{completedPayments.length} transactions</span>
          </div>
        </div>

        {/* Today's Cashflow */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Today's Revenue Inflow</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#1976D2]">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#123B5D]">
              {settings.currency} {todayRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span>Paybill/ID: {settings.mpesaShortcode || 'Active'}</span>
            <span className="text-emerald-600 font-semibold">Active</span>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Unpaid Invoiced Dues</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-900">
              {settings.currency} {totalOutstandingKes.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span className="text-amber-700 font-semibold">{unpaidInvoices.length} Invoices Pending</span>
            <span className="cursor-pointer text-[#1976D2] hover:underline" onClick={() => onNavigate('invoices')}>
              Manage
            </span>
          </div>
        </div>

        {/* ARPU */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-2 hover:border-[#1976D2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Average Revenue / User (ARPU)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#123B5D]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#123B5D]">
              {settings.currency} {arpuKes > 0 ? arpuKes.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-[#64748B]">/ user</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
            <span>{customers.length} total subscribers</span>
            <span className="text-emerald-600 font-semibold">Healthy Tier</span>
          </div>
        </div>
      </div>

      {/* Network & Infrastructure Status Strip (4 Mini KPI cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Active Subscribers</span>
            <span className="text-base font-bold text-[#123B5D]">{activeSubscribers} Online</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Suspended / Overdue</span>
            <span className="text-base font-bold text-rose-700">{suspendedSubscribers} Accounts</span>
          </div>
          <div className={`h-2 w-2 rounded-full ${suspendedSubscribers > 0 ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">MikroTik Routers</span>
            <span className="text-base font-bold text-[#123B5D]">{onlineRouters}/{routers.length} Online</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">WireGuard Gateway</span>
            <span className="text-base font-bold text-[#123B5D]">10.254.0.1/24</span>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
        </div>
      </div>

      {/* Main Analytics & Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tabbed Telemetry & Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#123B5D]">Operational & Revenue Analytics</h3>
              <p className="text-xs text-[#64748B]">Real-time telemetry and revenue performance curves</p>
            </div>

            {/* Tab Selector */}
            <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  activeChartTab === 'revenue'
                    ? 'bg-[#1976D2] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                Revenue ({settings.currency})
              </button>
              <button
                onClick={() => setActiveChartTab('bandwidth')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  activeChartTab === 'bandwidth'
                    ? 'bg-[#1976D2] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                Traffic (Mbps)
              </button>
              <button
                onClick={() => setActiveChartTab('subscribers')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  activeChartTab === 'subscribers'
                    ? 'bg-[#1976D2] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                Service Breakdown
              </button>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-72 w-full pt-2">
            {activeChartTab === 'revenue' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976D2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1976D2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(value: any) => [`${settings.currency} ${Number(value).toLocaleString()}`, 'Collections']} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1976D2"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name={`Revenue (${settings.currency})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'bandwidth' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bandwidthChartData}>
                  <defs>
                    <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B8D9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00B8D9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(value: any) => [`${value} Mbps`, 'Throughput']} />
                  <Area type="monotone" dataKey="downloadMbps" stroke="#00B8D9" strokeWidth={2} fillOpacity={1} fill="url(#colorDown)" name="Download (Mbps)" />
                  <Area type="monotone" dataKey="uploadMbps" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorUp)" name="Upload (Mbps)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'subscribers' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: 'PPPoE Residential', count: pppoeCount },
                    { category: 'Hotspot Wi-Fi', count: hotspotCount },
                    { category: 'Active Vouchers', count: activeVouchers },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#123B5D" radius={[6, 6, 0, 0]} name="Subscribers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Col: Core Gateway & Infrastructure Summary */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#1976D2]" /> Core ISP Infrastructure
            </h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              OPERATIONAL
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F5F8FC] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#123B5D]">WireGuard CGNAT Gateway</p>
                <p className="text-[11px] text-[#64748B] font-mono">{settings.vpnGatewayEndpoint}</p>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                10.254.0.0/24
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F8FC] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#123B5D]">FreeRADIUS PostgreSQL AAA</p>
                <p className="text-[11px] text-[#64748B]">Auth 1812 &bull; Acct 1813 &bull; CoA 3799</p>
              </div>
              <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#1976D2]">
                RFC 2865/2866
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F8FC] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#123B5D]">Safaricom Daraja API</p>
                <p className="text-[11px] text-[#64748B]">Paybill / Till: {settings.mpesaShortcode}</p>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                {settings.mpesaEnvironment}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F8FC] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#123B5D]">Upstream Connections</p>
                <p className="text-[11px] text-[#64748B]">{upstreamConnections.length} Active WAN Links</p>
              </div>
              <span className="text-[#1976D2] font-bold text-xs cursor-pointer hover:underline" onClick={() => onNavigate('upstream')}>
                View WANs
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('connect_mikrotik')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] py-3 text-xs font-bold text-white hover:bg-[#0B2A43] shadow-xs transition-colors"
            >
              <Zap className="h-4 w-4 text-[#00B8D9]" />
              Connect Another MikroTik Router
            </button>
          </div>
        </div>
      </div>

      {/* Recent M-Pesa Collections & Subscriber Activity Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#123B5D]">Recent M-Pesa Collections & Transactions</h3>
            <p className="text-xs text-[#64748B]">Latest verified subscriber payments with Daraja receipt numbers</p>
          </div>

          <button
            onClick={() => onNavigate('payments')}
            className="text-xs font-bold text-[#1976D2] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Transactions ({payments.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl bg-[#F5F8FC] p-8 text-center space-y-2">
            <CreditCard className="h-8 w-8 text-[#64748B] mx-auto" />
            <p className="text-sm font-bold text-[#123B5D]">No transactions recorded yet</p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              When subscribers pay via Safaricom Daraja STK Push or buy vouchers, every verified transaction will appear here in real time.
            </p>
            <button
              onClick={() => onNavigate('payments')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Initiate Test Payment</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Receipt Number</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Subscriber / Phone</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Amount (KES)</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Method</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {payments.slice(0, 5).map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-[#F5F8FC]/60">
                      <td className="px-4 py-2.5 font-mono font-bold text-[#123B5D]">
                        {p.mpesaReceiptNumber || 'PENDING'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold">{cust?.fullName || p.phone}</span>
                        <span className="block text-[10px] text-[#64748B] font-mono">{p.phone}</span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-emerald-700">
                        KES {p.amountKes.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 uppercase text-[10px] font-semibold text-[#64748B]">
                        {p.method.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#64748B] text-[11px]">
                        {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
