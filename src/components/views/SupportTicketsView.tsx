import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Search,
  Filter,
  Users,
  Wrench,
  Phone,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { SupportTicket } from '../../types';

export const SupportTicketsView: React.FC = () => {
  const { tickets, addTicket, updateTicket, customers, sites } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('2547');
  const [category, setCategory] = useState<
    'no_internet' | 'slow_speeds' | 'router_offline' | 'billing_payment' | 'physical_fibre_cut' | 'installation'
  >('no_internet');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('Field Tech NOC');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');

  // Ticket resolution modal state
  const [resolutionNote, setResolutionNote] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.assignedTechnician && t.assignedTechnician.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tickets, searchTerm, selectedStatus, selectedCategory]);

  // Derived Dynamic Metrics
  const totalTickets = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
  const criticalCount = tickets.filter((t) => t.priority === 'critical' && t.status !== 'resolved').length;

  // Handle customer dropdown select
  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.fullName);
      setCustomerPhone(found.phone);
      if (found.siteId) setSiteId(found.siteId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !subject.trim()) return;

    const newTicket = addTicket({
      tenantId: 'tenant_ke_001',
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      category,
      priority,
      status: 'open',
      subject: subject.trim(),
      description: description.trim(),
      assignedTechnician: assignedTechnician.trim() || undefined,
      siteId: siteId || undefined,
    });

    setIsAddModalOpen(false);
    showToast(`Logged Ticket #${newTicket.ticketNumber} for ${customerName}`);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('2547');
    setCategory('no_internet');
    setPriority('high');
    setSubject('');
    setDescription('');
    setAssignedTechnician('Field Tech NOC');
  };

  const handleQuickResolve = (ticketId: string) => {
    updateTicket(ticketId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    showToast('Ticket marked as Resolved.');
    if (viewingTicket?.id === ticketId) {
      setViewingTicket(null);
    }
  };

  const handleUpdateStatus = (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    updateTicket(ticketId, {
      status: newStatus,
      resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date().toISOString() : undefined,
    });
    showToast(`Ticket status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    if (viewingTicket?.id === ticketId) {
      setViewingTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Quick preset helper
  const handleAddPresetTicket = (subj: string, cat: any, prio: any, desc: string) => {
    const cust = customers[0];
    const newT = addTicket({
      tenantId: 'tenant_ke_001',
      customerId: cust?.id,
      customerName: cust?.fullName || 'John Mwangi',
      customerPhone: cust?.phone || '254712345678',
      category: cat,
      priority: prio,
      status: 'open',
      subject: subj,
      description: desc,
      assignedTechnician: 'NOC Lead Engineer',
      siteId: cust?.siteId || sites[0]?.id,
    });
    showToast(`Logged ticket #${newT.ticketNumber}: ${subj}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
            Customer Support & Incident Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Troubleshoot physical fibre drop cuts, slow speeds, ONU optical signal drops, and subscriber billing inquiries.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#123B5D] self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Total Incidents</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#1976D2]">
              <LifeBuoy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalTickets}</span>
            <span className="text-xs text-[#64748B]">logged</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {criticalCount > 0 ? (
              <span className="text-rose-600 font-semibold">{criticalCount} critical priority</span>
            ) : (
              'All SLAs on schedule'
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Open & Pending</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600">{openCount}</span>
            <span className="text-xs text-[#64748B]">waiting</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Requires triage / dispatch</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">In Progress</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-indigo-600">{inProgressCount}</span>
            <span className="text-xs text-[#64748B]">field dispatch</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Technicians currently on-site</div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Resolved Today</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{resolvedCount}</span>
            <span className="text-xs text-[#64748B]">closed</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {totalTickets > 0 ? `${Math.round((resolvedCount / totalTickets) * 100)}% resolution rate` : '100% resolution'}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticket #, customer name, phone, issue..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-xs text-[#172B4D] placeholder-[#64748B] focus:border-[#1976D2] focus:outline-hidden"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-[#64748B]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `All (${totalTickets})` },
              { id: 'open', label: `Open (${openCount})` },
              { id: 'in_progress', label: `In Progress (${inProgressCount})` },
              { id: 'resolved', label: `Resolved (${resolvedCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
                  selectedStatus === st.id
                    ? 'bg-[#123B5D] text-white'
                    : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'no_internet', label: 'No Internet' },
            { id: 'slow_speeds', label: 'Slow Speeds' },
            { id: 'physical_fibre_cut', label: 'Fibre Cut' },
            { id: 'router_offline', label: 'ONU Offline' },
            { id: 'billing_payment', label: 'Billing / M-Pesa' },
            { id: 'installation', label: 'New Install' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#1976D2] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table or Card View */}
      {tickets.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1976D2]">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No support incidents logged</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mt-1">
              All subscriber services and fibre circuits are functioning optimally. Log customer inquiries, optical drops, or field dispatches here.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1976D2] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#123B5D] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Log Support Ticket</span>
            </button>
          </div>

          {/* Quick incident presets */}
          <div className="pt-4 border-t border-[#E2E8F0] max-w-xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Or test standard ISP NOC incident flows:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleAddPresetTicket(
                    'Red LOS Flashing on Huawei ONT',
                    'physical_fibre_cut',
                    'critical',
                    'Drop cable severed by road construction near gate. Optical power at -40dBm.'
                  )
                }
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Red LOS Flashing</div>
                <div className="text-[10px] text-[#64748B]">Fibre Cut • Critical Priority</div>
              </button>
              <button
                onClick={() =>
                  handleAddPresetTicket(
                    'High Latency on PPPoE Stream',
                    'slow_speeds',
                    'medium',
                    'Customer complaining of buffering on Netflix. Ping to gateway ~85ms.'
                  )
                }
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">High Latency Report</div>
                <div className="text-[10px] text-[#64748B]">Bandwidth Quota • Medium Priority</div>
              </button>
            </div>
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <p className="text-xs text-[#64748B]">No tickets match the search query "{searchTerm}".</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedCategory('all');
            }}
            className="mt-2 text-xs font-semibold text-[#1976D2] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
              <thead className="bg-[#F5F8FC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ticket ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Subscriber</th>
                  <th className="px-4 py-3 text-left font-semibold">Subject & Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Priority</th>
                  <th className="px-4 py-3 text-left font-semibold">Technician</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172B4D]">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F8FC]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#123B5D]">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{t.ticketNumber}</span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#123B5D]">{t.customerName}</div>
                      <div className="text-[10px] text-[#64748B] font-mono flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5 text-emerald-600" />
                        {t.customerPhone}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-[#123B5D] truncate">{t.subject}</div>
                      <div className="text-[10px] text-[#64748B] uppercase font-medium">
                        {t.category.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          t.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : t.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-[#64748B]">
                      {t.assignedTechnician ? (
                        <span className="font-semibold text-[#172B4D]">{t.assignedTechnician}</span>
                      ) : (
                        <span className="italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingTicket(t)}
                          className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-[#123B5D] hover:bg-slate-200"
                        >
                          View / Edit
                        </button>
                        {t.status !== 'resolved' && (
                          <button
                            onClick={() => handleQuickResolve(t.id)}
                            className="rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                          >
                            <CheckCheck className="h-3 w-3" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredTickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#123B5D] bg-slate-100 px-2 py-0.5 rounded">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        t.priority === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      t.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#123B5D]">{t.subject}</h4>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{t.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs rounded-lg bg-[#F5F8FC] p-2.5">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Subscriber</span>
                    <span className="font-semibold text-[#172B4D]">{t.customerName}</span>
                    <span className="text-[10px] text-[#64748B] block font-mono">{t.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Category</span>
                    <span className="font-semibold text-[#172B4D] uppercase text-[11px]">
                      {t.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => setViewingTicket(t)}
                    className="text-xs font-semibold text-[#1976D2] hover:text-[#123B5D]"
                  >
                    View Details
                  </button>
                  {t.status !== 'resolved' && (
                    <button
                      onClick={() => handleQuickResolve(t.id)}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: Log Support Ticket */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-[#1976D2]" />
                <h3 className="text-base font-bold text-[#123B5D]">Log Support Ticket</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#172B4D] p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {/* Customer selection */}
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Select Customer (Optional)</label>
                <select
                  value={customerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                >
                  <option value="">-- Manual Customer Entry --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.accountNumber}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Samuel Mwangi"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="no_internet">No Internet Connection</option>
                    <option value="slow_speeds">Slow Speeds / High Latency</option>
                    <option value="physical_fibre_cut">Physical Fibre Drop Cut</option>
                    <option value="router_offline">CPE / ONU Offline</option>
                    <option value="billing_payment">Billing or M-Pesa Query</option>
                    <option value="installation">New Installation Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    <option value="low">Low (Standard SLA)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Fibre Outage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Issue Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Red LOS Light flashing on Huawei ONT"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-semibold focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Description & Troubleshooting</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location, ONT light indications, PON signal level, and technician findings..."
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Assigned Field Technician</label>
                  <input
                    type="text"
                    value={assignedTechnician}
                    onChange={(e) => setAssignedTechnician(e.target.value)}
                    placeholder="e.g. Kevin Otieno"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">PoP Hub / Site</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    {sites.length === 0 && <option value="">Main Network Hub</option>}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1976D2] px-5 py-2 font-bold text-white hover:bg-[#123B5D] transition-colors"
                >
                  Log Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Update Ticket Details */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2 py-0.5 rounded">
                  {viewingTicket.ticketNumber}
                </span>
                <h3 className="text-base font-bold text-[#123B5D] mt-1">{viewingTicket.subject}</h3>
              </div>
              <button onClick={() => setViewingTicket(null)} className="text-[#64748B] hover:text-[#172B4D] p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#F5F8FC] p-3">
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase font-medium">Customer</span>
                  <span className="font-bold text-[#123B5D]">{viewingTicket.customerName}</span>
                  <a
                    href={`tel:${viewingTicket.customerPhone}`}
                    className="font-mono text-[11px] text-[#1976D2] hover:underline block"
                  >
                    {viewingTicket.customerPhone}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase font-medium">Technician</span>
                  <span className="font-bold text-[#172B4D]">{viewingTicket.assignedTechnician || 'Unassigned'}</span>
                  <span className="text-[10px] text-[#64748B] block">Status: {viewingTicket.status.toUpperCase()}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#172B4D] block mb-1">Issue Narrative:</span>
                <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                  {viewingTicket.description || 'No detailed technician notes provided.'}
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <label className="block font-semibold text-[#172B4D] mb-1.5">Change Incident Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(viewingTicket.id, 'open')}
                    className={`rounded-lg py-2 font-bold text-xs ${
                      viewingTicket.status === 'open'
                        ? 'bg-amber-600 text-white'
                        : 'border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F8FC]'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingTicket.id, 'in_progress')}
                    className={`rounded-lg py-2 font-bold text-xs ${
                      viewingTicket.status === 'in_progress'
                        ? 'bg-blue-600 text-white'
                        : 'border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F8FC]'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(viewingTicket.id, 'resolved')}
                    className={`rounded-lg py-2 font-bold text-xs ${
                      viewingTicket.status === 'resolved'
                        ? 'bg-emerald-600 text-white'
                        : 'border border-[#E2E8F0] text-[#172B4D] hover:bg-[#F5F8FC]'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setViewingTicket(null)}
                className="rounded-lg bg-[#123B5D] px-4 py-2 font-bold text-white text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
