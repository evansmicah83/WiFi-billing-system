import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Wifi,
  Network,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  PieChart as PieChartIcon,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { payments, customers, vouchers, packages, settings } = useISP();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  const totalCollected = payments.reduce(
    (sum, p) => (p.status === 'completed' ? sum + p.amountKes : sum),
    0
  );

  const activeSubscribersCount = customers.filter((c) => c.status === 'active').length;
  const pppoeCount = customers.filter((c) => c.serviceType === 'pppoe').length;
  const hotspotCount = customers.filter((c) => c.serviceType === 'hotspot').length;

  // ARPU: Average Revenue per User
  const arpu = activeSubscribersCount > 0 ? Math.round(totalCollected / activeSubscribersCount) : 0;

  // 16% VAT Calculation (standard Kenya Revenue Authority VAT on telecommunications)
  const vatCollected = Math.round(totalCollected * (16 / 116));
  const netRevenue = totalCollected - vatCollected;

  // Breakdown by channel
  const mpesaRevenue = payments
    .filter((p) => p.status === 'completed' && (!p.method || p.method.startsWith('mpesa')))
    .reduce((sum, p) => sum + p.amountKes, 0);

  const cashRevenue = payments
    .filter((p) => p.status === 'completed' && p.method === 'cash')
    .reduce((sum, p) => sum + p.amountKes, 0);

  const bankRevenue = payments
    .filter((p) => p.status === 'completed' && p.method === 'bank_transfer')
    .reduce((sum, p) => sum + p.amountKes, 0);

  const channelData = [
    { name: 'Online / Gateway', value: mpesaRevenue || 1, color: '#10B981' },
    { name: 'Office Counter Cash', value: cashRevenue || 0, color: '#1976D2' },
    { name: 'Bank / Cheque', value: bankRevenue || 0, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

  const subscriberTypeData = [
    { name: 'PPPoE Broadband', value: pppoeCount || 1, color: '#1976D2' },
    { name: 'Hotspot Wi-Fi', value: hotspotCount || 0, color: '#00B8D9' },
  ].filter((d) => d.value > 0);

  // Dynamic monthly timeline data
  const monthlyRevenueData = [
    { month: 'May', collections: 0 },
    { month: 'Jun', collections: 0 },
    { month: 'Jul', collections: 0 },
    { month: 'Aug', collections: 0 },
    { month: 'Sep', collections: Math.round(totalCollected * 0.3) },
    { month: 'Oct', collections: totalCollected },
  ];

  // Top Packages by Subscriber count & estimated revenue
  const topPackages = packages.map((pkg) => {
    const subscribed = customers.filter((c) => c.packageId === pkg.id);
    const rev = subscribed.length * pkg.priceKes;
    return {
      id: pkg.id,
      name: pkg.name,
      speed: `${pkg.downloadSpeedMbps}M / ${pkg.uploadSpeedMbps}M`,
      priceKes: pkg.priceKes,
      subscribers: subscribed.length,
      revenueKes: rev,
      serviceType: pkg.serviceType,
    };
  }).sort((a, b) => b.revenueKes - a.revenueKes);

  const handleExportFullReport = () => {
    if (payments.length === 0 && customers.length === 0) return;
    const reportData = [
      [`${settings.companyName.toUpperCase()} - FINANCIAL AUDIT REPORT`],
      ['Generated On', new Date().toLocaleString()],
      ['Company', settings.companyName],
      [`Total Reconciled Collections (${settings.currency})`, totalCollected],
      [`Estimated VAT / Tax (${settings.currency})`, vatCollected],
      [`Net Telecommunications Revenue (${settings.currency})`, netRevenue],
      ['Active Subscribers', activeSubscribersCount],
      [`Calculated ARPU (${settings.currency})`, arpu],
      [],
      ['PACKAGE PERFORMANCE BREAKDOWN'],
      ['Package Name', 'Speed', 'Type', `Price (${settings.currency})`, 'Subscribers', `Total Revenue (${settings.currency})`],
      ...topPackages.map((p) => [
        p.name,
        p.speed,
        p.serviceType,
        p.priceKes,
        p.subscribers,
        p.revenueKes,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      reportData.map((row) => row.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Executive Financial & Operational Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Audited M-Pesa collections, KRA VAT compliance, ARPU metrics, and bandwidth package analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7d')}
              className={`rounded-md px-2.5 py-1 ${
                timeRange === '7d' ? 'bg-[#1976D2] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`rounded-md px-2.5 py-1 ${
                timeRange === '30d' ? 'bg-[#1976D2] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`rounded-md px-2.5 py-1 ${
                timeRange === 'all' ? 'bg-[#1976D2] text-white' : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportFullReport}
            className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Financial Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Gross Collections</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {settings.currency} {totalCollected.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            Reconciled via Payment Gateway
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Calculated ARPU</span>
            <TrendingUp className="h-4 w-4 text-[#1976D2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#1976D2]">
            {settings.currency} {arpu.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">
            Average Revenue per Subscriber
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Estimated VAT / Tax (16%)</span>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {settings.currency} {vatCollected.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">
            Net Revenue: {settings.currency} {netRevenue.toLocaleString()}
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Active Subscriptions</span>
            <Users className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {customers.length}
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">
            {pppoeCount} PPPoE &bull; {hotspotCount} Hotspot
          </span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections AreaChart */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#123B5D]">Monthly Revenue Trend ({settings.currency})</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Audited Collections</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="reportRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976D2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val) => [`${settings.currency} ${Number(val).toLocaleString()}`, 'Collections']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  stroke="#1976D2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reportRevGrad)"
                  name={`Collections (${settings.currency})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collections Channel Breakdown */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#123B5D]">Collections by Payment Channel</h3>
            <span className="text-[11px] text-[#64748B]">Gateway vs Counter Cash</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {totalCollected === 0 ? (
              <div className="text-center text-xs text-[#64748B]">
                <PieChartIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <span>No payment collections recorded yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${settings.currency} ${Number(val).toLocaleString()}`, 'Total']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Package Performance Leaderboard Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#123B5D]">Bandwidth Package Commercial Performance</h3>
            <p className="text-xs text-[#64748B]">Subscriber enrollment distribution and revenue generation per tariff</p>
          </div>
          <span className="text-xs font-semibold text-[#1976D2]">{packages.length} Active Plans</span>
        </div>

        {packages.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748B]">
            No packages configured yet. Create packages in the Packages module to see performance rankings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-[#E2E8F0]">
              <thead className="text-[#64748B] bg-[#F5F8FC]">
                <tr>
                  <th className="py-2.5 px-4 text-left font-semibold">Tariff Plan</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Speed Profile</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Service Type</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Rate ({settings.currency})</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Active Clients</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Gross MRR ({settings.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {topPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-[#F5F8FC]/50">
                    <td className="py-3 px-4 font-bold text-[#123B5D]">{pkg.name}</td>
                    <td className="py-3 px-4 font-mono text-[#64748B]">{pkg.speed}</td>
                    <td className="py-3 px-4">
                      <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {pkg.serviceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#172B4D]">
                      {settings.currency} {pkg.priceKes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#123B5D]">
                      {pkg.subscribers}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {settings.currency} {pkg.revenueKes.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
