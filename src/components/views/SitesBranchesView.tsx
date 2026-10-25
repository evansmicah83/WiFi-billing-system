import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  MapPin,
  Phone,
  Router,
  Trash2,
  X,
  Search,
  Users,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';
import { NetworkSite } from '../../types';

export const SitesBranchesView: React.FC = () => {
  const { sites, addSite, deleteSite, routers, customers, setSelectedSiteId } = useISP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingSite, setViewingSite] = useState<NetworkSite | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<NetworkSite | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [county, setCounty] = useState('Central');
  const [area, setArea] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('+1 ');
  const [notes, setNotes] = useState('');

  // Distinct regions/counties present in current sites
  const existingCounties = useMemo(() => {
    const list = Array.from(new Set(sites.map((s) => s.county).filter(Boolean)));
    return list.sort();
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCounty = selectedCounty === 'all' || site.county.toLowerCase() === selectedCounty.toLowerCase();
      return matchesSearch && matchesCounty;
    });
  }, [sites, searchTerm, selectedCounty]);

  // Dynamic Metrics
  const totalSites = sites.length;
  const totalRoutersEnrolled = routers.length;
  const totalSubscribersConnected = customers.length;
  const onlineRoutersCount = routers.filter((r) => r.status === 'online').length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addSite({
      tenantId: 'tenant_ke_001',
      name: name.trim(),
      code: code.trim().toUpperCase(),
      county,
      area: area.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      notes: notes.trim(),
    });

    setIsAddModalOpen(false);
    showToast(`PoP Site "${name.trim()}" successfully created!`);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setCounty('Central');
    setArea('');
    setContactPerson('');
    setContactPhone('+1 ');
    setNotes('');
  };

  const confirmDelete = () => {
    if (!siteToDelete) return;
    const siteName = siteToDelete.name;
    deleteSite(siteToDelete.id);
    setSiteToDelete(null);
    showToast(`Site "${siteName}" removed.`);
  };

  // Quick Preset Helper for rapid realistic onboarding
  const handleQuickPreset = (presetName: string, presetCode: string, presetCounty: string, presetArea: string) => {
    addSite({
      tenantId: 'tenant_core_001',
      name: presetName,
      code: presetCode,
      county: presetCounty,
      area: presetArea,
      contactPerson: 'NOC Lead Engineer',
      contactPhone: '+1 800 555 0199',
      notes: 'Standard Point of Presence distribution hub',
    });
    showToast(`Added ${presetName} PoP.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            Sites, Branches & Network PoPs
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage physical Points of Presence (PoPs), distribution towers, estate fibre hubs, and technician assignments.
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
          <span>Add Network Site</span>
        </button>
      </div>

      {/* Executive KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Total PoPs & Sites</span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#1976D2]">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalSites}</span>
            <span className="text-xs text-[#64748B]">locations</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {existingCounties.length > 0 ? `${existingCounties.length} counties covered` : '0 counties'}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Stationed Routers</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Router className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalRoutersEnrolled}</span>
            <span className="text-xs text-[#64748B]">devices</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            {onlineRoutersCount} online / reachable
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Connected Subscribers</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#123B5D]">{totalSubscribersConnected}</span>
            <span className="text-xs text-[#64748B]">accounts</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">
            {totalSites > 0 ? `${Math.round(totalSubscribersConnected / totalSites)} avg / site` : 'No active sites'}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Network Health</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              {totalRoutersEnrolled === 0 ? '100%' : `${Math.round((onlineRoutersCount / (totalRoutersEnrolled || 1)) * 100)}%`}
            </span>
            <span className="text-xs text-[#64748B]">uptime</span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748B]">Core OLT & Backhaul ready</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PoP name, code, estate, technician..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-xs text-[#172B4D] placeholder-[#64748B] focus:border-[#1976D2] focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#172B4D]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* County Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCounty('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
              selectedCounty === 'all'
                ? 'bg-[#123B5D] text-white'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
            }`}
          >
            All Counties ({totalSites})
          </button>
          {existingCounties.map((c) => {
            const count = sites.filter((s) => s.county.toLowerCase() === c.toLowerCase()).length;
            return (
              <button
                key={c}
                onClick={() => setSelectedCounty(c)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 ${
                  selectedCounty === c
                    ? 'bg-[#1976D2] text-white'
                    : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5F8FC]'
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Sites Listing or Zero State */}
      {sites.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1976D2]">
            <Building className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#123B5D]">No network sites registered yet</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto mt-1">
              Create physical PoPs (e.g. "Westlands PoP", "Kilimani Hub", "Nyali Node") to group MikroTik routers, associate GPON OLTs, and manage field technicians.
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
              <span>Create Custom Site</span>
            </button>
          </div>

          {/* Quick Setup Presets */}
          <div className="pt-4 border-t border-[#E2E8F0] max-w-xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Or quick-initialize with standard PoP hubs:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickPreset('Downtown Central PoP', 'DTC-01', 'Central District', 'Main Optical Hub')}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Downtown Central PoP</div>
                <div className="text-[10px] text-[#64748B]">DTC-01 • Core Hub</div>
              </button>
              <button
                onClick={() => handleQuickPreset('Metro West Tower', 'MWT-01', 'West District', 'Tower Station Alpha')}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Metro West Tower</div>
                <div className="text-[10px] text-[#64748B]">MWT-01 • Wireless Tower</div>
              </button>
              <button
                onClick={() => handleQuickPreset('Northside Node PoP', 'NSN-01', 'North Sector', 'Distribution Facility')}
                className="text-left rounded-lg border border-[#E2E8F0] p-2.5 hover:border-[#1976D2] hover:bg-blue-50/50 transition-colors"
              >
                <div className="font-bold text-xs text-[#123B5D]">Northside Node PoP</div>
                <div className="text-[10px] text-[#64748B]">NSN-01 • Fiber Aggregation</div>
              </button>
            </div>
          </div>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <p className="text-xs text-[#64748B]">No network sites match your search filter "{searchTerm}".</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCounty('all');
            }}
            className="mt-2 text-xs font-semibold text-[#1976D2] hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSites.map((site) => {
            const siteRouters = routers.filter((r) => r.siteId === site.id);
            const siteCustomers = customers.filter((c) => c.siteId === site.id);
            const activeRouters = siteRouters.filter((r) => r.status === 'online');

            return (
              <div
                key={site.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-[#1976D2] transition-colors"
              >
                <div className="space-y-3">
                  {/* Card Top Strip */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {site.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        siteRouters.length === 0
                          ? 'bg-slate-100 text-slate-700'
                          : activeRouters.length > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {siteRouters.length === 0
                        ? 'No Routers'
                        : `${activeRouters.length}/${siteRouters.length} Online`}
                    </span>
                  </div>

                  {/* Site Title & Region */}
                  <div>
                    <h3 className="text-base font-bold text-[#123B5D]">{site.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#1976D2] shrink-0" />
                      <span>{site.area ? `${site.area}, ${site.county}` : site.county}</span>
                    </div>
                  </div>

                  {/* Key Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F5F8FC] p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block uppercase font-medium">Routers</span>
                      <span className="font-bold text-[#123B5D] flex items-center gap-1">
                        <Router className="h-3.5 w-3.5 text-[#1976D2]" />
                        {siteRouters.length} deployed
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block uppercase font-medium">Subscribers</span>
                      <span className="font-bold text-[#123B5D] flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        {siteCustomers.length} active
                      </span>
                    </div>
                  </div>

                  {/* Technician Contact */}
                  {site.contactPerson && (
                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{site.contactPerson}</span>
                      </div>
                      <a
                        href={`tel:${site.contactPhone}`}
                        className="font-mono text-[11px] text-[#1976D2] hover:underline shrink-0"
                      >
                        {site.contactPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3">
                  <button
                    onClick={() => setViewingSite(site)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1976D2] hover:text-[#123B5D]"
                  >
                    <span>View PoP Profile</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setSiteToDelete(site)}
                    className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Site"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Site */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-[#1976D2]" />
                <h3 className="text-base font-bold text-[#123B5D]">Add Network Site / PoP</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-[#172B4D] p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Site / PoP Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Westlands PoP Hub"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Site Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WST-01"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono uppercase focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Region / State / County *</label>
                  <input
                    type="text"
                    required
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="e.g. Central District, California, London"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Area / Landmark / Address</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. 5th Avenue, Tower 2 or Central Data Center"
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Field Tech / Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Kevin Otieno"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 font-mono focus:border-[#1976D2] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tower height, backup generator or solar details, landlord contact..."
                  className="w-full rounded-lg border border-[#E2E8F0] p-2.5 focus:border-[#1976D2] focus:outline-hidden"
                ></textarea>
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
                  Save Network Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Site Profile Details */}
      {viewingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1976D2] bg-blue-50 px-2.5 py-0.5 rounded">
                    {viewingSite.code}
                  </span>
                  <h3 className="text-base font-bold text-[#123B5D]">{viewingSite.name}</h3>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {viewingSite.area ? `${viewingSite.area}, ${viewingSite.county}` : viewingSite.county}
                </p>
              </div>
              <button
                onClick={() => setViewingSite(null)}
                className="text-[#64748B] hover:text-[#172B4D] p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stationed Routers at this PoP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#123B5D]">
                <span>Stationed MikroTik Routers ({routers.filter((r) => r.siteId === viewingSite.id).length})</span>
              </div>
              {routers.filter((r) => r.siteId === viewingSite.id).length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] p-4 text-center text-xs text-[#64748B]">
                  No routers currently linked to this PoP. Head to "Connect MikroTik" or "Routers" to associate a router.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {routers
                    .filter((r) => r.siteId === viewingSite.id)
                    .map((router) => (
                      <div
                        key={router.id}
                        className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Router className="h-4 w-4 text-[#1976D2]" />
                          <div>
                            <div className="font-bold text-[#123B5D]">{router.name}</div>
                            <div className="text-[10px] text-[#64748B] font-mono">{router.managementIp}</div>
                          </div>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            router.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {router.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Subscribers at this PoP */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs font-bold text-[#123B5D]">
                <span>Active Subscribers ({customers.filter((c) => c.siteId === viewingSite.id).length})</span>
              </div>
              {customers.filter((c) => c.siteId === viewingSite.id).length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] p-4 text-center text-xs text-[#64748B]">
                  No customers registered under this site yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {customers
                    .filter((c) => c.siteId === viewingSite.id)
                    .slice(0, 10)
                    .map((cust) => (
                      <div
                        key={cust.id}
                        className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#172B4D]">{cust.fullName}</span>
                          <span className="text-[10px] text-[#64748B] ml-2 font-mono">{cust.accountNumber}</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          {cust.serviceType.toUpperCase()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Field Technician Contact */}
            {viewingSite.contactPerson && (
              <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-[#123B5D] flex items-center justify-between">
                <div>
                  <div className="font-bold">Assigned Field Tech: {viewingSite.contactPerson}</div>
                  <div className="text-[11px] text-[#64748B]">Available for line repairs & fiber splicing</div>
                </div>
                <a
                  href={`tel:${viewingSite.contactPhone}`}
                  className="rounded-lg bg-[#1976D2] px-3 py-1.5 font-bold text-white text-[11px] hover:bg-[#123B5D]"
                >
                  Call {viewingSite.contactPhone}
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setViewingSite(null)}
                className="rounded-lg bg-[#123B5D] px-4 py-2 font-bold text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Modal: Confirm Delete Site (Zero blocking window.confirm) */}
      {siteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#123B5D]">Remove Network Site?</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#123B5D]">{siteToDelete.name}</span> ({siteToDelete.code})?
              Any routers or customers associated with this site will need to be reallocated.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setSiteToDelete(null)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#F5F8FC]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
              >
                Yes, Delete Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
