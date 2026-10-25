import React, { useState } from 'react';
import { History, Search, ShieldCheck, Download, Trash2 } from 'lucide-react';
import { useISP } from '../../context/ISPContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useISP();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.targetResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const json = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartlinknet_audit_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Security & Operational Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Tamper-evident logs of administrative actions, router configuration events, and billing transactions.
          </p>
        </div>

        {auditLogs.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
          >
            <Download className="h-4 w-4" />
            <span>Export Logs (JSON)</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by action, target resource, details..."
          className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-4 py-2 text-xs text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
        />
      </div>

      {/* Logs Table or Zero State */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-2">
          <History className="h-8 w-8 text-[#64748B] mx-auto" />
          <h4 className="text-sm font-bold text-[#123B5D]">No audit events logged yet</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            All configuration updates, payments, and router enrollments will be recorded here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
            <thead className="bg-[#F5F8FC] text-[#64748B]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold">Actor / Role</th>
                <th className="px-4 py-3 text-left font-semibold">Action Event</th>
                <th className="px-4 py-3 text-left font-semibold">Target Resource</th>
                <th className="px-4 py-3 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F5F8FC]/60">
                  <td className="px-4 py-3 text-[#64748B] font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#123B5D]">{log.actorName}</div>
                    <div className="text-[10px] text-[#64748B] uppercase">{log.actorRole.replace('_', ' ')}</div>
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-[#1976D2]">
                    {log.action}
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#172B4D]">
                    {log.targetResource}
                  </td>

                  <td className="px-4 py-3 text-[#64748B] max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
