import React, { useState } from 'react';
import {
  Menu,
  ShieldCheck,
  Radio,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Building2,
  Server,
  User as UserIcon,
} from 'lucide-react';
import { useISP } from '../../context/ISPContext';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, activeTab }) => {
  const { currentUser, settings, sites, selectedSiteId, setSelectedSiteId, routers, auditLogs } = useISP();
  const [showNotifications, setShowNotifications] = useState(false);

  const onlineRouters = routers.filter((r) => r.status === 'online').length;
  const currentSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-3 sm:px-6 shadow-xs">
      {/* Left: Mobile Menu Toggle & Brand / Active Page */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#123B5D] hover:bg-[#F5F8FC] lg:hidden focus:outline-hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#123B5D] text-white font-bold shadow-xs">
            <Radio className="h-5 w-5 text-[#00B8D9]" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight text-[#123B5D] leading-tight">
              {settings.companyName || 'ISP Core Platform'}
            </h1>
            <p className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
              <span>ISP Network Hub</span>
              <span className="inline-block h-1 w-1 rounded-full bg-[#16A34A]"></span>
              <span className="text-[#16A34A] font-semibold">
                {currentSite
                  ? `${currentSite.name} (${currentSite.code})`
                  : sites.length > 0
                  ? `All Network Sites (${sites.length})`
                  : 'Core Gateway Ready'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Site Selector & CGNAT Gateway Health */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Site Filter */}
        <div className="relative flex items-center">
          <Building2 className="pointer-events-none absolute left-2.5 h-4 w-4 text-[#64748B]" />
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] pl-8 pr-4 text-xs font-medium text-[#172B4D] focus:border-[#1976D2] focus:outline-hidden"
          >
            <option value="all">All Network Sites ({sites.length})</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.code})
              </option>
            ))}
          </select>
        </div>

        {/* Live Gateway Badges (hidden on very small screens) */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>WireGuard: Up</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-800 font-medium">
            <Server className="h-3.5 w-3.5 text-blue-600" />
            <span>RADIUS: Active</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Routers: {onlineRouters}/{routers.length}</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & Current User */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]"
            title="Operational Activity"
          >
            <Bell className="h-4 w-4" />
            {auditLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1976D2] text-[10px] font-bold text-white">
                {auditLogs.length > 9 ? '9+' : auditLogs.length}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-2">
                <span className="text-xs font-bold text-[#123B5D] uppercase tracking-wider">
                  Live Operations Stream
                </span>
                <span className="text-[11px] text-[#64748B]">{auditLogs.length} events logged</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {auditLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#64748B]">
                    No recent events yet. Actions taken on the network will appear here.
                  </div>
                ) : (
                  auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#123B5D]">{log.action}</span>
                        <span className="text-[10px] text-[#64748B]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#172B4D] mt-0.5">{log.details}</p>
                      <div className="text-[10px] text-[#64748B] mt-1 flex items-center justify-between">
                        <span>{log.targetResource}</span>
                        <span>{log.actorName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F5F8FC] px-2.5 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#123B5D] text-white">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-[#123B5D] leading-none">{currentUser.name}</p>
            <p className="text-[10px] font-medium text-[#1976D2] uppercase tracking-wider mt-0.5">
              Super Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
