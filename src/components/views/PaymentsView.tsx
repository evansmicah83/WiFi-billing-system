import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  DollarSign,
  X,
  Phone,
  ShieldCheck,
  AlertCircle,
  Download,
  Filter,
  ArrowDownRight,
  TrendingUp,
  Receipt,
  Check,
  Copy,
  Calendar,
  Building2,
  Radio,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { PaymentTransaction } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const PaymentsView: React.FC = () => {
  const { payments, customers, settings, initiateMpesaStkPush, recordDirectPayment, verifyMpesaC2bPayment } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'mpesa' | 'cash' | 'bank'>('all');
  const [isStkModalOpen, setIsStkModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isPaybillModalOpen, setIsPaybillModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<string | null>(null);

  // STK form state
  const [stkPhone, setStkPhone] = useState(settings.currency === 'KES' ? '0712345678' : '+15550199');
  const [stkAmount, setStkAmount] = useState(25);
  const [stkDesc, setStkDesc] = useState('Monthly Internet Subscription');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isSendingStk, setIsSendingStk] = useState(false);
  const [stkResult, setStkResult] = useState<string | null>(null);

  // Cash payment form state
  const [cashCustomerId, setCashCustomerId] = useState(customers[0]?.id || '');
  const [cashAmount, setCashAmount] = useState(25);
  const [cashDesc, setCashDesc] = useState('Cash Payment at Office Counter');

  // Paybill verification state
  const [paybillReceipt, setPaybillReceipt] = useState('');
  const [paybillPhone, setPaybillPhone] = useState(settings.currency === 'KES' ? '0712345678' : '+15550199');
  const [paybillAmount, setPaybillAmount] = useState(25);
  const [paybillCustomerId, setPaybillCustomerId] = useState(customers[0]?.id || '');
  const [isVerifyingPaybill, setIsVerifyingPaybill] = useState(false);
  const [paybillResult, setPaybillResult] = useState<string | null>(null);

  const totalCollected = payments.reduce(
    (sum, p) => (p.status === 'completed' ? sum + p.amountKes : sum),
    0
  );

  const today = new Date().toISOString().split('T')[0];
  const todayCollected = payments
    .filter((p) => p.status === 'completed' && p.createdAt.startsWith(today))
    .reduce((sum, p) => sum + p.amountKes, 0);

  const completedCount = payments.filter((p) => p.status === 'completed').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  // Chart data: Collections by day of the past 7 days
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayTotal = payments
      .filter((p) => p.status === 'completed' && p.createdAt.startsWith(dateStr))
      .reduce((sum, p) => sum + p.amountKes, 0);
    return { day: dayLabel, date: dateStr, amount: dayTotal };
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.phone.includes(searchTerm) ||
      (p.mpesaReceiptNumber && p.mpesaReceiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod =
      methodFilter === 'all'
        ? true
        : methodFilter === 'mpesa'
        ? p.method.startsWith('mpesa')
        : methodFilter === 'cash'
        ? p.method === 'cash'
        : p.method === 'bank_transfer';
    return matchesSearch && matchesMethod;
  });

  const handleCopyReceipt = (rcpt: string) => {
    navigator.clipboard.writeText(rcpt);
    setCopiedReceipt(rcpt);
    setTimeout(() => setCopiedReceipt(null), 2000);
  };

  const handleExportCsv = () => {
    if (payments.length === 0) return;
    const headers = ['Receipt No', 'Phone', `Amount (${settings.currency})`, 'Method', 'Status', 'Description', 'Timestamp'];
    const rows = payments.map((p) => [
      p.mpesaReceiptNumber || 'N/A',
      p.phone,
      p.amountKes,
      p.method,
      p.status,
      p.description,
      p.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payment_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendStk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkPhone || stkAmount <= 0) return;

    setIsSendingStk(true);
    setStkResult(null);

    try {
      const res = await initiateMpesaStkPush(
        stkPhone,
        Number(stkAmount),
        stkDesc,
        selectedCustomerId || undefined
      );
      setStkResult(`Payment prompt confirmed! Receipt: ${res.mpesaReceiptNumber}`);
      setTimeout(() => {
        setIsStkModalOpen(false);
        setStkResult(null);
      }, 1500);
    } catch {
      setStkResult('Error processing payment request.');
    } finally {
      setIsSendingStk(false);
    }
  };

  const handleRecordCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashCustomerId || cashAmount <= 0) return;

    const cust = customers.find((c) => c.id === cashCustomerId);
    recordDirectPayment({
      tenantId: settings.tenantId || 'tenant_001',
      customerId: cashCustomerId,
      amountKes: Number(cashAmount),
      method: 'cash',
      status: 'completed',
      phone: cust?.phone || '+1234567890',
      description: cashDesc,
    });

    setIsCashModalOpen(false);
  };

  const handleVerifyPaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paybillReceipt.trim()) return;

    setIsVerifyingPaybill(true);
    setPaybillResult(null);

    try {
      const res = await verifyMpesaC2bPayment(
        paybillReceipt.trim(),
        paybillPhone,
        Number(paybillAmount),
        paybillCustomerId || undefined
      );

      if (res.success && res.transaction) {
        setPaybillResult(`Verified! M-Pesa Receipt ${res.transaction.mpesaReceiptNumber} allocated.`);
        setTimeout(() => {
          setIsPaybillModalOpen(false);
          setPaybillResult(null);
          setPaybillReceipt('');
        }, 1800);
      } else {
        setPaybillResult(res.message);
      }
    } catch {
      setPaybillResult('Error verifying M-Pesa receipt.');
    } finally {
      setIsVerifyingPaybill(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Payments & Collections Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Automated mobile money callbacks, credit card/gateway reconciliation, and verifiable electronic receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {payments.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC]"
            >
              <Download className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Export Ledger</span>
            </button>
          )}

          <button
            onClick={() => setIsPaybillModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#1976D2]/30 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-[#1976D2] shadow-2xs hover:bg-blue-100 transition-colors"
          >
            <Radio className="h-3.5 w-3.5 text-[#1976D2]" />
            <span>Verify Paybill C2B</span>
          </button>

          <button
            onClick={() => setIsCashModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#123B5D] shadow-2xs hover:bg-slate-50"
          >
            <DollarSign className="h-3.5 w-3.5 text-slate-600" />
            <span>Record Cash</span>
          </button>

          <button
            onClick={() => setIsStkModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            <span>Initiate Direct Payment Prompt</span>
          </button>
        </div>
      </div>

      {/* Executive Financial KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total Collections</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {settings.currency} {totalCollected.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Gateway & Ledger Reconciled</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Today's Cashflow</span>
            <TrendingUp className="h-4 w-4 text-[#1976D2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {settings.currency} {todayCollected.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            From active subscribers & Hotspot
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Settled Transactions</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">{completedCount}</div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {pendingCount} Pending Gateway Confirmation
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Billing Shortcode / Paybill</span>
            <ShieldCheck className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#123B5D]">
            {settings.mpesaShortcode || 'ONLINE'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 uppercase font-mono">
            {settings.mpesaEnvironment || 'PRODUCTION'}
          </div>
        </div>
      </div>

      {/* 7-Day Collections Trend Chart */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#123B5D]">7-Day Revenue Collections Trend</h3>
            <p className="text-[11px] text-[#64748B]">Real-time daily inflow from payment gateways and counter payments</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {settings.currency} {totalCollected.toLocaleString()} Total
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7DaysData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
              <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} name={`Collections (${settings.currency})`} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by phone, receipt no, description..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#64748B]" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            <option value="mpesa">M-Pesa Only</option>
            <option value="cash">Counter Cash</option>
            <option value="bank">Bank / Cheque</option>
          </select>
        </div>
      </div>

      {/* Ledger Table / Zero State */}
      {filteredPayments.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#123B5D]">
            {payments.length === 0 ? 'No payments recorded yet' : 'No matching payment records found'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {payments.length === 0
              ? 'This system starts with zero demo data. When subscribers pay through Safaricom M-Pesa STK Push or buy Hotspot vouchers, verified receipts will appear here.'
              : 'Try clearing your search query or switching filters.'}
          </p>
          {payments.length === 0 && (
            <button
              onClick={() => setIsStkModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span>Initiate First M-Pesa STK Push</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Receipt / Reference</th>
                  <th className="px-4 py-3 text-left font-semibold">Subscriber / Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount ({settings.currency})</th>
                  <th className="px-4 py-3 text-left font-semibold">Channel</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-right font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredPayments.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[#123B5D]">
                          <span>{p.mpesaReceiptNumber || 'PENDING'}</span>
                          {p.mpesaReceiptNumber && (
                            <button
                              onClick={() => handleCopyReceipt(p.mpesaReceiptNumber!)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {copiedReceipt === p.mpesaReceiptNumber ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-[#64748B] truncate max-w-xs">{p.description}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#172B4D]">
                          {cust?.fullName || (p.customerId ? 'Subscriber' : 'Guest / Hotspot')}
                        </div>
                        <div className="font-mono text-[11px] text-[#64748B]">{p.phone}</div>
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-700">
                        {settings.currency} {p.amountKes.toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold uppercase text-[10px] text-slate-700 bg-slate-100 rounded px-2 py-0.5">
                          {p.method ? p.method.replace('_', ' ') : 'ONLINE'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                          {p.status === 'pending' && <Clock className="h-3 w-3 text-amber-600" />}
                          {p.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[#64748B]">
                        <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px]">{new Date(p.createdAt).toLocaleTimeString()}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="inline-flex items-center gap-1 rounded bg-[#F5F8FC] border border-[#E2E8F0] px-2.5 py-1 text-[11px] font-semibold text-[#123B5D] hover:bg-blue-50 hover:border-[#1976D2]"
                        >
                          <Receipt className="h-3 w-3 text-[#1976D2]" />
                          <span>View Receipt</span>
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
            {filteredPayments.map((p) => {
              const cust = customers.find((c) => c.id === p.customerId);
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#123B5D]">
                        {p.mpesaReceiptNumber || 'PENDING'}
                      </div>
                      <div className="text-xs font-semibold text-[#172B4D] mt-0.5">
                        {cust?.fullName || 'Hotspot / Guest'}
                      </div>
                    </div>
                    <span className="font-bold text-sm text-emerald-700">
                      {settings.currency} {p.amountKes.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-slate-100">
                    <span className="font-mono">{p.phone}</span>
                    <span className="text-[11px]">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>

                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#F5F8FC] border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#123B5D]"
                    >
                      <Receipt className="h-3.5 w-3.5 text-[#1976D2]" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Official Payment E-Receipt */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">Payment E-Receipt</h3>
                  <span className="text-[10px] text-emerald-700 font-semibold">VERIFIED ELECTRONIC LEDGER</span>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-center space-y-1">
              <span className="text-xs text-[#64748B]">Amount Paid</span>
              <div className="text-3xl font-black text-emerald-700">
                {settings.currency} {selectedReceipt.amountKes.toLocaleString()}.00
              </div>
              <div className="font-mono text-xs font-bold text-[#123B5D]">
                Receipt No: {selectedReceipt.mpesaReceiptNumber || 'TXN_REF_AUTO'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">ISP Provider:</span>
                <span className="font-semibold text-[#123B5D]">{settings.companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Gateway / Channel:</span>
                <span className="font-mono font-semibold text-[#123B5D]">
                  {selectedReceipt.method.toUpperCase()} {settings.mpesaShortcode ? `(${settings.mpesaShortcode})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Subscriber Phone:</span>
                <span className="font-mono font-semibold text-[#123B5D]">{selectedReceipt.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Description:</span>
                <span className="font-medium text-[#123B5D]">{selectedReceipt.description}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#64748B]">Timestamp:</span>
                <span className="font-mono text-[#123B5D]">
                  {new Date(selectedReceipt.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#64748B]">Status:</span>
                <span className="font-bold text-emerald-700 uppercase">{selectedReceipt.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#123B5D] hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg bg-[#1976D2] px-5 py-2 text-xs font-bold text-white hover:bg-[#123B5D]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Initiate Direct Payment Prompt */}
      {isStkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Initiate Instant Payment Prompt
              </h3>
              <button onClick={() => setIsStkModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendStk} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Subscriber (Optional Link)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) {
                      setStkPhone(cust.phone);
                    }
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Direct / Guest Payer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber} - {c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Subscriber Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  placeholder="+1234567890 or 2547XXXXXXXX"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-sm focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Amount ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={stkAmount}
                  onChange={(e) => setStkAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-sm focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Reference / Description</label>
                <input
                  type="text"
                  value={stkDesc}
                  onChange={(e) => setStkDesc(e.target.value)}
                  placeholder="Monthly Broadband Subscription"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {stkResult && (
                <div className="rounded-lg bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  {stkResult}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsStkModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingStk}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSendingStk ? 'Sending Prompt...' : 'Send Payment Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Direct Cash Payment */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Record Cash Payment
              </h3>
              <button onClick={() => setIsCashModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordCash} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Subscriber *</label>
                <select
                  required
                  value={cashCustomerId}
                  onChange={(e) => setCashCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="">-- Choose Subscriber --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Amount ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono text-sm focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Counter Notes</label>
                <input
                  type="text"
                  value={cashDesc}
                  onChange={(e) => setCashDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D]"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Verify Safaricom Paybill C2B Transaction */}
      {isPaybillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-[#1976D2]" />
                <h3 className="text-base font-bold text-[#123B5D]">
                  Verify Paybill C2B Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaybillModalOpen(false)}
                className="text-[#64748B] hover:text-[#172B4D]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs space-y-1 text-[#172B4D]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Business Shortcode:</span>
                <span className="font-mono font-bold text-[#123B5D]">{settings.mpesaShortcode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Environment:</span>
                <span className="font-mono text-emerald-800 font-bold uppercase">{settings.mpesaEnvironment}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyPaybill} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  M-Pesa SMS Transaction Code *
                </label>
                <input
                  type="text"
                  required
                  value={paybillReceipt}
                  onChange={(e) => setPaybillReceipt(e.target.value.toUpperCase())}
                  placeholder="e.g. QKH718293A"
                  className="w-full rounded-xl border border-[#E2E8F0] p-2.5 font-mono text-center text-sm font-bold uppercase focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Allocate to Subscriber
                </label>
                <select
                  value={paybillCustomerId}
                  onChange={(e) => {
                    setPaybillCustomerId(e.target.value);
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) {
                      setPaybillPhone(cust.phone);
                    }
                  }}
                  className="w-full rounded-xl border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="">-- Standalone Hotspot / Guest --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Payer Phone
                  </label>
                  <input
                    type="text"
                    value={paybillPhone}
                    onChange={(e) => setPaybillPhone(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    className="w-full rounded-xl border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paybillAmount}
                    onChange={(e) => setPaybillAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E2E8F0] p-2.5 font-mono font-bold focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              {paybillResult && (
                <div
                  className={`rounded-xl p-2.5 text-xs font-bold border ${
                    paybillResult.includes('Verified')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {paybillResult}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPaybillModalOpen(false)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPaybill || !paybillReceipt.trim()}
                  className="rounded-xl bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isVerifyingPaybill ? 'Verifying with Daraja...' : 'Verify & Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
