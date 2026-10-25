import React, { useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  X,
  Search,
  Filter,
  Download,
  DollarSign,
  AlertCircle,
  Building,
  User,
  CreditCard,
  QrCode,
  Check,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { BillingInvoice } from '../../types';

export const InvoicesView: React.FC = () => {
  const { invoices, customers, settings, addInvoice, markInvoicePaid } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [amountKes, setAmountKes] = useState(25);
  const [itemDesc, setItemDesc] = useState('Monthly Broadband Internet Subscription');
  const [dueDays, setDueDays] = useState(7);

  // Financial KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amountKes, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amountKes, 0);
  const totalUnpaid = invoices
    .filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amountKes, 0);
  const collectionRate =
    totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

  const filteredInvoices = invoices.filter((inv) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust &&
        (cust.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cust.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cust.phone.includes(searchTerm)));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'overdue'
        ? inv.status === 'overdue' || (inv.status === 'unpaid' && new Date(inv.dueDate) < new Date())
        : inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || amountKes <= 0) return;

    addInvoice({
      tenantId: settings.tenantId || 'tenant_ke_001',
      customerId,
      amountKes: Number(amountKes),
      status: 'unpaid',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + dueDays * 86400 * 1000).toISOString(),
      items: [{ description: itemDesc, amountKes: Number(amountKes) }],
    });

    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice Number', 'Customer', 'Account', 'Amount (KES)', 'Status', 'Issue Date', 'Due Date'];
    const rows = invoices.map((inv) => {
      const cust = customers.find((c) => c.id === inv.customerId);
      return [
        inv.invoiceNumber,
        cust?.fullName || 'N/A',
        cust?.accountNumber || 'N/A',
        inv.amountKes,
        inv.status,
        new Date(inv.issueDate).toLocaleDateString(),
        new Date(inv.dueDate).toLocaleDateString(),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartlinknet_invoices_${Date.now()}.csv`);
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
            Subscriber Invoices & Automated Billing
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage recurring monthly invoices, pro-rata adjustments, payment reminders, and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {invoices.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs hover:bg-[#F5F8FC]"
            >
              <Download className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total Invoiced</span>
            <FileText className="h-4 w-4 text-[#1976D2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {settings.currency} {totalInvoiced.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {invoices.length} Invoices Generated
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total Settled</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {settings.currency} {totalPaid.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">
            Reconciled via Online / Cash
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Outstanding Dues</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {settings.currency} {totalUnpaid.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-rose-600">
            Pending subscriber settlement
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Collection Ratio</span>
            <DollarSign className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#123B5D]">
            {collectionRate}%
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            Billed vs Collected efficiency
          </div>
        </div>
      </div>

      {/* Status Filter Tabs & Search */}
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
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              statusFilter === 'unpaid'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]'
            }`}
          >
            Unpaid ({invoices.filter((i) => i.status === 'unpaid').length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]'
            }`}
          >
            Paid ({invoices.filter((i) => i.status === 'paid').length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number, customer name, account number..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table or Zero State */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#123B5D]">
            {invoices.length === 0 ? 'No invoices generated yet' : 'No matching invoices found'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {invoices.length === 0
              ? 'This system starts with zero demo data. Invoices are generated automatically on subscription renewals or manually created for equipment and installation charges.'
              : 'Try clearing your search keyword or switching between the status tabs.'}
          </p>
          {invoices.length === 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#123B5D]"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Invoice</span>
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
                  <th className="px-4 py-3 text-left font-semibold">Invoice Number</th>
                  <th className="px-4 py-3 text-left font-semibold">Subscriber / Account</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount ({settings.currency})</th>
                  <th className="px-4 py-3 text-left font-semibold">Issue / Due Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredInvoices.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  const isPaid = inv.status === 'paid';
                  const isOverdue = !isPaid && new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="font-mono font-bold text-[#123B5D] hover:text-[#1976D2] hover:underline"
                        >
                          {inv.invoiceNumber}
                        </button>
                        <div className="text-[10px] text-[#64748B]">
                          {inv.items?.[0]?.description || 'Internet Service'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#172B4D]">{cust?.fullName || 'Customer'}</div>
                        <div className="font-mono text-[10px] text-[#64748B]">{cust?.accountNumber}</div>
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-700">
                        {settings.currency} {inv.amountKes.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-[#64748B]">
                        <div>Issued: {new Date(inv.issueDate).toLocaleDateString()}</div>
                        <div className={`text-[10px] ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3" />}
                          {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'UNPAID'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => markInvoicePaid(inv.id)}
                              className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              title="Mark Settled"
                            >
                              Settle
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1 rounded bg-[#F5F8FC] border border-[#E2E8F0] px-2 py-1 text-[11px] font-semibold text-[#123B5D] hover:bg-blue-50 hover:border-[#1976D2]"
                          >
                            <Printer className="h-3 w-3 text-[#1976D2]" />
                            <span>PDF Print</span>
                          </button>
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
            {filteredInvoices.map((inv) => {
              const cust = customers.find((c) => c.id === inv.customerId);
              const isPaid = inv.status === 'paid';

              return (
                <div
                  key={inv.id}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#123B5D]">{inv.invoiceNumber}</div>
                      <div className="text-xs font-semibold text-[#172B4D] mt-0.5">{cust?.fullName}</div>
                    </div>
                    <span className="font-bold text-sm text-emerald-700">
                      KES {inv.amountKes.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-slate-100">
                    <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#F5F8FC] border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#123B5D]"
                    >
                      <Printer className="h-3.5 w-3.5 text-[#1976D2]" />
                      <span>View PDF</span>
                    </button>

                    {!isPaid && (
                      <button
                        onClick={() => markInvoicePaid(inv.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Settle Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">Generate Customer Invoice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Subscriber *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="">-- Choose Subscriber --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber})
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Tip: Add your first subscriber from the Subscribers module.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Amount ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amountKes}
                  onChange={(e) => setAmountKes(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Line Item Description</label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. Monthly Broadband Internet Subscription"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Payment Due Within</label>
                <select
                  value={dueDays}
                  onChange={(e) => setDueDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Standard)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
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
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official PDF-Style Printable Invoice */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-auto animate-in fade-in">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#E2E8F0] pb-6">
              <div>
                <h2 className="text-xl font-black text-[#123B5D] tracking-tight">{settings.companyName}</h2>
                <p className="text-xs text-[#64748B] mt-0.5">{settings.tagline}</p>
                <div className="text-xs text-[#64748B] mt-2 space-y-0.5">
                  <div>Region/City: {settings.countyCity}</div>
                  <div>Support: {settings.supportPhone} | {settings.supportEmail}</div>
                  {settings.mpesaShortcode && <div>Billing Paybill/Code: {settings.mpesaShortcode}</div>}
                </div>
              </div>

              <div className="sm:text-right">
                <div className="inline-block px-3 py-1 rounded bg-[#F5F8FC] border border-[#E2E8F0] font-mono text-xs font-bold text-[#123B5D]">
                  TAX INVOICE
                </div>
                <div className="font-mono text-base font-black text-[#123B5D] mt-1">
                  {selectedInvoice.invoiceNumber}
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  Issued: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                </div>
                <div className="text-xs text-[#64748B]">
                  Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill-To Section */}
            {(() => {
              const cust = customers.find((c) => c.id === selectedInvoice.customerId);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F5F8FC] p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Billed To
                    </span>
                    <div className="text-sm font-bold text-[#123B5D]">{cust?.fullName || 'Valued Subscriber'}</div>
                    <div className="font-mono text-[#64748B]">Acc No: {cust?.accountNumber}</div>
                    <div className="text-[#64748B] mt-0.5">Phone: {cust?.phone}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Service Address
                    </span>
                    <div className="text-[#172B4D]">
                      {cust?.estateBuilding ? `${cust.estateBuilding}, Unit ${cust.houseRoomNo || 'N/A'}` : cust?.physicalAddress || 'Subscriber Location'}
                    </div>
                    {cust?.pppoeUsername && (
                      <div className="font-mono text-[11px] text-[#1976D2] mt-0.5">
                        PPPoE: {cust.pppoeUsername}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="py-2 text-left font-semibold">Description</th>
                    <th className="py-2 text-center font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Rate</th>
                    <th className="py-2 text-right font-semibold">Amount ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(selectedInvoice.items || [{ description: 'Internet Service', amountKes: selectedInvoice.amountKes }]).map(
                    (item: { description: string; amountKes: number }, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium text-[#123B5D]">{item.description}</td>
                        <td className="py-3 text-center text-[#64748B]">1</td>
                        <td className="py-3 text-right font-mono text-[#64748B]">
                          {item.amountKes.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-[#123B5D]">
                          {item.amountKes.toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Calculation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-[#E2E8F0] text-xs">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 max-w-sm">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-700" />
                  Payment Remittance Instructions:
                </div>
                <div className="mt-1 text-emerald-800 space-y-0.5 font-mono text-[11px]">
                  <div>Provider: <strong>{settings.companyName}</strong></div>
                  <div>Account Reference: <strong>{customers.find((c) => c.id === selectedInvoice.customerId)?.accountNumber || 'YOUR_ACC'}</strong></div>
                  {settings.mpesaShortcode && <div>Paybill / Gateway Code: <strong>{settings.mpesaShortcode}</strong></div>}
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <div className="flex justify-between sm:justify-end gap-6 text-[#64748B]">
                  <span>Subtotal:</span>
                  <span className="font-mono">{settings.currency} {selectedInvoice.amountKes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-[#64748B]">
                  <span>VAT / Tax (Incl.):</span>
                  <span className="font-mono">
                    {settings.currency} {Math.round(selectedInvoice.amountKes * (16 / 116)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-base font-black text-[#123B5D] pt-1 border-t border-[#E2E8F0]">
                  <span>Total Due:</span>
                  <span className="text-emerald-700 font-mono">
                    {settings.currency} {selectedInvoice.amountKes.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-2 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#172B4D]"
              >
                Close
              </button>
              {selectedInvoice.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => {
                    markInvoicePaid(selectedInvoice.id);
                    setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Settle & Renew Term</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-5 py-2 text-xs font-bold text-white hover:bg-[#123B5D]"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
