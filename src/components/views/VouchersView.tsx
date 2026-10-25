import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  X,
  QrCode,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { HotspotVoucher } from '../../types';

export const VouchersView: React.FC = () => {
  const { vouchers, packages, sites, generateVouchersBatch, revokeVoucher, settings } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printBatchId, setPrintBatchId] = useState<string>('all');

  // Generator form
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id || '');
  const [count, setCount] = useState(20);
  const [prefix, setPrefix] = useState(settings.companyName ? settings.companyName.substring(0, 3).toUpperCase() : 'WIFI');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [generateError, setGenerateError] = useState<string | null>(null);

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.batchId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const vouchersToPrint =
    printBatchId === 'all'
      ? filteredVouchers.slice(0, 30)
      : vouchers.filter((v) => v.batchId === printBatchId);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgId) {
      setGenerateError('Please select a package first.');
      return;
    }
    setGenerateError(null);
    generateVouchersBatch(selectedPkgId, Number(count), prefix, siteId);
    setIsGenerateModalOpen(false);
  };

  const handleExportCsv = () => {
    if (vouchers.length === 0) return;
    const headers = ['Code', 'PIN', `PackagePrice (${settings.currency})`, 'Status', 'BatchID', 'CreatedAt'];
    const rows = vouchers.map((v) => [v.code, v.pin || '', v.priceKes, v.status, v.batchId, v.createdAt]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotspot_vouchers_${Date.now()}.csv`);
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
            Hotspot Vouchers & Batch Printing
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Generate high-entropy random voucher pins for Wi-Fi hotspot resale and print physical cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {vouchers.length > 0 && (
            <>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
              >
                <Printer className="h-4 w-4 text-[#1976D2]" />
                <span>Print Cards Sheet</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#123B5D]"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Vouchers</span>
          </button>
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
            placeholder="Search by voucher code or batch ID..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#64748B]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#172B4D] focus:outline-hidden"
          >
            <option value="all">All Vouchers ({vouchers.length})</option>
            <option value="available">Available (Unused)</option>
            <option value="in_use">Active Online</option>
            <option value="used">Redeemed / Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table or Zero Data State */}
      {filteredVouchers.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1976D2]">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-[#123B5D]">
            {vouchers.length === 0 ? 'No vouchers generated yet' : 'No matching vouchers found'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {vouchers.length === 0
              ? 'Generate a batch of vouchers for a Hotspot Wi-Fi package. Vouchers can be sold directly or distributed to local shops/resellers.'
              : 'Try changing your search term or status filter.'}
          </p>
          {vouchers.length === 0 && (
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#123B5D]"
            >
              <Plus className="h-4 w-4" />
              <span>Generate First Batch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
            <thead className="bg-[#F5F8FC] text-[#64748B]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Voucher Code</th>
                <th className="px-4 py-3 text-left font-semibold">Package & Value</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Batch ID</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
              {filteredVouchers.map((v) => {
                const pkg = packages.find((p) => p.id === v.packageId);
                return (
                  <tr key={v.id} className="hover:bg-[#F5F8FC]/60">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-[#123B5D] tracking-wider">
                        {v.code}
                      </span>
                      {v.pin && <span className="block font-mono text-[10px] text-[#64748B]">PIN: {v.pin}</span>}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#123B5D]">{pkg?.name || 'Wi-Fi Pass'}</div>
                      <div className="text-[11px] font-bold text-emerald-600">{settings.currency} {v.priceKes}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          v.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'in_use'
                            ? 'bg-blue-100 text-blue-800'
                            : v.status === 'revoked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {v.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">{v.batchId}</td>

                    <td className="px-4 py-3 text-[#64748B]">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {v.status === 'available' && (
                        <button
                          onClick={() => revokeVoucher(v.id)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Generate Vouchers */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-base font-bold text-[#123B5D]">Generate Vouchers Batch</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-[#64748B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {generateError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generateError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Select Internet Package *</label>
                <select
                  required
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="">-- Choose Package --</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {settings.currency} {p.priceKes} ({p.serviceType.toUpperCase()})
                    </option>
                  ))}
                </select>
                {packages.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Tip: Go to Packages module to create your Wi-Fi plans first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Quantity (Cards)</label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:outline-hidden"
                  >
                    <option value={10}>10 Vouchers</option>
                    <option value={20}>20 Vouchers</option>
                    <option value={50}>50 Vouchers</option>
                    <option value={100}>100 Vouchers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Voucher Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="WIFI"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packages.length === 0}
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] disabled:opacity-50"
                >
                  Generate Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Voucher Cards Sheet */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 print:hidden">
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">Printable Vouchers Sheet (A4 Grid)</h3>
                <p className="text-xs text-[#64748B]">
                  Ready to print for sales counter or street resellers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-bold text-white hover:bg-[#123B5D]"
                >
                  <Printer className="h-4 w-4" />
                  <span>Send to Printer</span>
                </button>
                <button onClick={() => setIsPrintModalOpen(false)} className="text-[#64748B]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3">
              {vouchersToPrint.map((v) => {
                const pkg = packages.find((p) => p.id === v.packageId);
                return (
                  <div
                    key={v.id}
                    className="border-2 border-dashed border-[#123B5D]/40 rounded-xl p-3 bg-white space-y-2 text-center"
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
